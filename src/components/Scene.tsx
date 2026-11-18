import { useEffect, useRef, type RefObject } from "react";
import s from "./Scene.module.css";

const TILE_DESKTOP = 180; // design px
const TILE_MOBILE = 104; // design px
const TILE_FROM = 0.2; // scroll progress where the first tile starts
const TILE_SPREAD = 0.55; // progress range over which tiles start
const TILE_FADE = 0.15; // progress each tile takes to turn white
const SEED = 7;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function order(n: number): number[] {
  let seed = SEED;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const ranks = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ranks[i], ranks[j]] = [ranks[j], ranks[i]];
  }
  return ranks;
}

type Props = {
  nightSrc: string | null;
  daySrc: string | null;
  visible: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  rootRef: RefObject<HTMLDivElement | null>;
  glowRef: RefObject<HTMLDivElement | null>;
};

export default function Scene({ nightSrc, daySrc, visible, sectionRef, rootRef, glowRef }: Props) {
  const tilesRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = tilesRef.current;
    const probe = probeRef.current;
    const section = sectionRef.current;
    if (!box || !probe || !section) return;

    const mobileQuery = window.matchMedia("(max-width: 1023px)");
    let tiles: HTMLDivElement[] = [];
    let rank: number[] = [];
    let raf = 0;
    let needsBuild = false;

    const build = () => {
      box.replaceChildren();
      const unit = probe.getBoundingClientRect().width / 100;
      const size = (mobileQuery.matches ? TILE_MOBILE : TILE_DESKTOP) * unit;
      const W = box.clientWidth;
      const H = box.clientHeight;
      if (size <= 0 || W <= 0 || H <= 0) {
        tiles = [];
        rank = [];
        return;
      }
      const cols = Math.ceil(W / size);
      const rows = Math.ceil(H / size);
      const frag = document.createDocumentFragment();
      tiles = [];
      for (let r = 0; r < rows; r++) {
        const top = Math.round(r * size);
        const height = Math.round((r + 1) * size) - top;
        for (let c = 0; c < cols; c++) {
          const left = Math.round(c * size);
          const width = Math.round((c + 1) * size) - left;
          const el = document.createElement("div");
          el.className = s.tile;
          el.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;opacity:0`;
          frag.appendChild(el);
          tiles.push(el);
        }
      }
      box.appendChild(frag);
      rank = order(tiles.length);
    };

    const update = () => {
      const q = clamp(1 - section.getBoundingClientRect().top / window.innerHeight, 0, 1);
      const div = Math.max(1, tiles.length - 1);
      tiles.forEach((el, i) => {
        const start = TILE_FROM + (TILE_SPREAD * rank[i]) / div;
        el.style.opacity = String(clamp((q - start) / TILE_FADE, 0, 1));
      });
    };

    const frame = () => {
      raf = 0;
      if (needsBuild) {
        needsBuild = false;
        build();
      }
      update();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      needsBuild = true;
      onScroll();
    };

    build();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      box.replaceChildren();
    };
  }, [sectionRef]);

  return (
    <div ref={rootRef} className={`${s.scene} ${visible ? s.visible : ""}`} aria-hidden="true">
      {nightSrc && <img src={nightSrc} alt="" className={s.image} />}
      {daySrc && <img src={daySrc} alt="" className={`${s.image} ${s.day}`} />}
      <div ref={glowRef} className={s.glow} />
      <div className={s.shade} />
      <div ref={tilesRef} className={s.tiles} />
      <div ref={probeRef} className={s.probe} />
    </div>
  );
}
