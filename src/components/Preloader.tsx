import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import s from "./Preloader.module.css";

export const PATH =
  "M919.486 547.507C899.916 481.274 1030.31 451.248 1074.72 498.165C1090.28 514.612 1103.31 591.523 1019.5 625.5" +
  "C927 663 762.922 637.74 788.275 514.612C804.037 438.067 910.59 386.617 961.741 377.257" +
  "C1088.06 354.142 1125.09 413.127 1153 440.379C1230.39 515.943 1236.2 660.976 992.431 730.647" +
  "C831.999 776.5 631.999 620.5 754 448.5";
const CENTER = { x: 958, y: 555 }; // middle of the wiped patch: the origin of the expansion
const RES = 0.5; // fog canvas resolution
const COMP_W = 1920;
const COMP_H = 1080;
const FOG_BLUR = 17.3; // comp px
const GRAIN_BLUR = 4.2; // comp px
const GRAIN_ALPHA = 0.1;
const BRUSH = 300; // comp px
const BRUSH_START = 0.35; // share of the brush at the start of the stroke
const BRUSH_GROW = 0.2; // share of the path over which the brush widens
const SWEEP = 1.2; // s for a full wipe at full speed
const RAMP = 0.35; // s to reach full speed
const FADE_IN = 0.6;
const HAND_RISE = 160; // comp px
const HAND_LAND = 0.6;
const PRESS_AT = 0.4;
const PRESS_FADE = 0.3;
const WIPE_DELAY = HAND_LAND + 0.2;
const WAIT_CAP = 0.9; // share of `loaded` the wipe may reach before everything is ready
const MAX_DT = 0.1;
const FINGER = { x: 276.9, y: 66.2 }; // finger pad within the hand box

export type LoadState = { loaded: number; ready: boolean; shown: number; expand: number };
export type PreloaderAssets = { bitmap: ImageBitmap; handSrc: string };

const HAS_FILTER = typeof CanvasRenderingContext2D !== "undefined" && "filter" in CanvasRenderingContext2D.prototype;

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Draws `src` into `ctx` blurred by `radius` px, with a downscale fallback where canvas filters are missing. */
function drawBlurred(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  radius: number,
  cw: number,
  ch: number,
  factor = 12,
) {
  if (HAS_FILTER) {
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(src, dx, dy, dw, dh);
    ctx.filter = "none";
    return;
  }
  const small = makeCanvas(cw / factor, ch / factor);
  const sctx = small.getContext("2d")!;
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(src, dx / factor, dy / factor, dw / factor, dh / factor);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, cw, ch);
}

function buildFog(img: ImageBitmap, cw: number, ch: number, scale: number, tint: string) {
  const base = makeCanvas(cw, ch);
  const ctx = base.getContext("2d")!;

  // the night image, cover-fitted to a box 3 × the blur radius larger on each side, blurred
  const blur = FOG_BLUR * scale * RES;
  const pad = 3 * blur;
  const bw = cw + 2 * pad;
  const bh = ch + 2 * pad;
  const k = Math.max(bw / img.width, bh / img.height);
  const dw = img.width * k;
  const dh = img.height * k;
  drawBlurred(ctx, img, (cw - dw) / 2, (ch - dh) / 2, dw, dh, blur, cw, ch);

  // the fog tint
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, cw, ch);

  // grain: half the pixels white at alpha 0.1, softened into an even haze
  const grain = makeCanvas(cw, ch);
  const gctx = grain.getContext("2d")!;
  const data = gctx.createImageData(grain.width, grain.height);
  const a = Math.round(GRAIN_ALPHA * 255);
  for (let i = 0; i < data.data.length; i += 4) {
    if (Math.random() < 0.5) {
      data.data[i] = 255;
      data.data[i + 1] = 255;
      data.data[i + 2] = 255;
      data.data[i + 3] = a;
    }
  }
  gctx.putImageData(data, 0, 0);
  drawBlurred(ctx, grain, 0, 0, cw, ch, GRAIN_BLUR * scale * RES, cw, ch, 3);
  return base;
}

type Props = {
  assets: PreloaderAssets | null;
  state: RefObject<LoadState>;
  onWiped: () => void;
};

export default function Preloader({ assets, state, onWiped }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compRef = useRef<HTMLDivElement>(null);
  const handOuterRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const onWipedRef = useRef(onWiped);

  useEffect(() => {
    onWipedRef.current = onWiped;
  }, [onWiped]);

  useEffect(() => {
    if (!assets) return;
    const scene = sceneRef.current!;
    const canvas = canvasRef.current!;
    const comp = compRef.current!;
    const handOuter = handOuterRef.current!;
    const hand = handRef.current!;
    const press = pressRef.current!;
    const num = numRef.current!;
    const svgPath = pathRef.current!;
    const ctx = canvas.getContext("2d")!;
    const length = svgPath.getTotalLength();
    const stroke = new Path2D(PATH);
    const tint = getComputedStyle(document.documentElement).getPropertyValue("--fog-tint").trim();

    const f = { s: 1, ox: 0, oy: 0 };
    let fogBase: HTMLCanvasElement | null = null;

    const layout = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      f.s = Math.max(W / COMP_W, H / COMP_H);
      f.ox = (W - COMP_W * f.s) / 2;
      f.oy = (H - COMP_H * f.s) / 2;
      comp.style.transform = `translate(${f.ox}px, ${f.oy}px) scale(${f.s})`;
      canvas.width = Math.max(0, Math.round(W * RES));
      canvas.height = Math.max(0, Math.round(H * RES));
      fogBase = canvas.width && canvas.height ? buildFog(assets.bitmap, canvas.width, canvas.height, f.s, tint) : null;
    };
    layout();

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(layout);
    };
    window.addEventListener("resize", onResize);

    const gctx = gsap.context(() => {
      gsap.to(scene, { opacity: 1, duration: FADE_IN, ease: "power1.out" });
      gsap.fromTo(hand, { y: HAND_RISE, opacity: 0 }, { y: 0, opacity: 1, duration: HAND_LAND, ease: "power2.out" });
      gsap.fromTo(press, { opacity: 0 }, { opacity: 1, duration: PRESS_FADE, delay: PRESS_AT });
    });

    const draw = () => {
      const w = state.current;
      const drawn = w.shown * length;
      const p = svgPath.getPointAtLength(drawn);
      handOuter.style.transform = `translate(${p.x - FINGER.x}px, ${p.y - FINGER.y}px)`;

      if (!canvas.width || !canvas.height || !fogBase) return;
      const e = w.expand;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fogBase, 0, 0, canvas.width, canvas.height);
      if (drawn > 0.5) {
        const k = f.s * e * RES;
        ctx.setTransform(
          k,
          0,
          0,
          k,
          (f.ox + f.s * CENTER.x * (1 - e)) * RES,
          (f.oy + f.s * CENTER.y * (1 - e)) * RES,
        );
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = BRUSH * (BRUSH_START + (1 - BRUSH_START) * smoothstep(w.shown / BRUSH_GROW));
        ctx.setLineDash([drawn, length + 1]);
        ctx.shadowColor = "#000";
        ctx.shadowBlur = GRAIN_BLUR * 2 * k;
        ctx.stroke(stroke);
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }
    };

    const t0 = performance.now();
    let last = t0;
    let raf = 0;
    let wiped = false;
    const frame = (now: number) => {
      const dt = Math.min(MAX_DT, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      const w = state.current;
      if (t >= WIPE_DELAY) {
        const speed = (Math.min(1, (t - WIPE_DELAY) / RAMP) * 1) / SWEEP;
        const cap = w.ready ? 1 : Math.max(w.shown, w.loaded * WAIT_CAP);
        w.shown = Math.max(w.shown, Math.min(cap, w.shown + speed * dt, 1));
      }
      num.textContent = `${String(Math.round(w.shown * 100)).padStart(2, "0")}%`;
      draw();
      if (!wiped && w.ready && w.shown >= 1) {
        wiped = true;
        onWipedRef.current();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      gctx.revert();
    };
  }, [assets, state]);

  return (
    <div className={s.root} aria-hidden="true">
      <div ref={sceneRef} className={s.scene}>
        <canvas ref={canvasRef} className={s.canvas} />
        <div ref={compRef} className={s.comp}>
          <div ref={handOuterRef} className={s.handOuter}>
            <div ref={handRef} className={s.hand} data-hand="">
              {assets && <img src={assets.handSrc} alt="" className={s.handImage} />}
              <span ref={pressRef} className={s.press} data-press="" />
            </div>
          </div>
        </div>
      </div>
      <p className={s.counter} data-counter="">
        [<span ref={numRef} className={s.num}>00%</span>]
      </p>
      <svg className={s.path} aria-hidden="true">
        <path ref={pathRef} d={PATH} />
      </svg>
    </div>
  );
}
