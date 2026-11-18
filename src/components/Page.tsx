import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { loadImages } from "../lib/loadImages";
import Scene from "./Scene";
import Nav from "./Nav";
import Hero from "./Hero";
import Clarity from "./Clarity";
import Preloader, { type LoadState, type PreloaderAssets } from "./Preloader";
import { RING_LENGTH } from "./LensCard";

const IMAGES = {
  night: "https://assets.uberdesigner.ai/lucid/night.webp",
  hand: "https://assets.uberdesigner.ai/lucid/hand.webp",
  day: "https://assets.uberdesigner.ai/lucid/day.webp",
};
const FONTS = ['400 1em "Geist"', '500 1em "Geist"', 'italic 400 1em "Instrument Serif"'];

const SCORE = 87;
const LIGHT_AT = 0.1; // section 2's top within 10% of the viewport height from the top
const EXPAND_TO = 7;

// intro (M2) times, in seconds from the end of the wipe
const T = {
  handDrop: 0,
  counter: 0.1,
  nav: 0.2,
  expand: 0.3,
  headline: 0.75,
  lead: 1.3,
  demo: 1.5,
  glowIn: 1.6,
  glowOut: 2.05,
  sun: 1.75,
  card: 1.9,
  discover: 1.95,
  ring: 2.1,
};

const CHAR_FROM = { opacity: 0, filter: "blur(18px)", xPercent: -30 };
const CHAR_TO = {
  opacity: 1,
  filter: "blur(0px)",
  xPercent: 0,
  duration: 0.8,
  ease: "power2.out",
  stagger: 0.035,
  clearProps: "filter,transform",
};

function blurIn(tl: gsap.core.Timeline, target: Element | null, at: number, blur = 10, duration = 0.6) {
  if (!target) return;
  tl.fromTo(
    target,
    { opacity: 0, filter: `blur(${blur}px)` },
    { opacity: 1, filter: "blur(0px)", duration, ease: "power2.out", clearProps: "filter" },
    at,
  );
}

function revealChars(tl: gsap.core.Timeline, heading: Element | null, at: number) {
  if (!heading) return;
  tl.set(heading, { opacity: 1 }, at);
  heading.querySelectorAll("[data-line]").forEach((line) => {
    tl.fromTo(line.querySelectorAll("[data-char]"), CHAR_FROM, { ...CHAR_TO }, at);
  });
}

const unlockScroll = () => {
  document.documentElement.style.overflow = "";
};

type PageProps = {
  /** Shopify mode: no nav of its own, and every query stays inside `scope`. */
  embedded?: boolean; // also leaves out section 2 and its tiles
  scope?: Element;
};

export default function Page({ embedded = false, scope }: PageProps) {
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const stateRef = useRef<LoadState>({ loaded: 0, ready: false, shown: 0, expand: 1 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const clarityRef = useRef<HTMLElement>(null);

  const [preAssets, setPreAssets] = useState<PreloaderAssets | null>(null);
  const [nightSrc, setNightSrc] = useState<string | null>(null);
  const [daySrc, setDaySrc] = useState<string | null>(null);
  const [sceneVisible, setSceneVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [wiped, setWiped] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // without the preloader (reduced motion or a failed load), the page shows as soon as it can
  const plain = (reduced || failed) && (ready || failed);
  const unlocked = introDone || plain;

  // M0 · loading
  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = "hidden";
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const st = stateRef.current;
    const ac = new AbortController();
    const urls: string[] = [];
    let stale = false;
    let bitmap: ImageBitmap | null = null;
    const objectUrl = (b: Blob) => {
      const u = URL.createObjectURL(b);
      urls.push(u);
      return u;
    };
    const fail = (err: unknown) => {
      if (stale) return;
      console.error(err);
      setFailed(true);
    };

    const [pNight, pHand, pDay] = loadImages(
      [IMAGES.night, IMAGES.hand, IMAGES.day],
      (p) => {
        st.loaded = p;
      },
      ac.signal,
    );
    // keep a rejected promise from surfacing as "unhandled" before Promise.all sees it
    [pNight, pHand, pDay].forEach((p) => p.catch(() => {}));

    Promise.all([pNight, pHand])
      .then(async ([night, hand]) => {
        const bmp = reduced ? null : await createImageBitmap(night);
        if (stale) {
          bmp?.close();
          return;
        }
        bitmap = bmp;
        setNightSrc(objectUrl(night));
        if (bmp) {
          setPreAssets({ bitmap: bmp, handSrc: objectUrl(hand) });
          setSceneVisible(true);
        }
      })
      .catch(fail);

    Promise.all([pNight, pHand, pDay])
      .then(async ([, , day]) => {
        if (stale) return;
        const u = objectUrl(day);
        const img = new Image();
        img.src = u;
        await img.decode();
        await Promise.all(FONTS.map((f) => document.fonts.load(f)));
        if (stale) return;
        setDaySrc(u);
        st.ready = true;
        setReady(true);
      })
      .catch(fail);

    return () => {
      stale = true;
      ac.abort();
      bitmap?.close();
      urls.forEach((u) => URL.revokeObjectURL(u));
      html.style.overflow = "";
    };
  }, [reduced]);

  // reduced motion, or a failed load: no preloader, no sunrise, a plain fade
  useEffect(() => {
    if (!reduced && !failed) return;
    if (!ready && !failed) return;
    const ctx = gsap.context(() => {
      if (sceneRef.current) gsap.set(sceneRef.current, { "--sun": 1 });
      gsap.to('[data-reveal]:not([data-reveal^="clarity"])', { opacity: 1, duration: 0.4, ease: "power1.out" });
    }, scope);
    unlockScroll();
    return () => ctx.revert();
  }, [reduced, failed, ready, scope]);

  const onWiped = useCallback(() => setWiped(true), []);

  // M2 · intro, keyed only on the end of the wipe
  useEffect(() => {
    if (!wiped) return;
    const st = stateRef.current;
    const ctx = gsap.context(() => {
      const q = (sel: string) => (scope ?? document).querySelector(sel);
      const ring = q("[data-ring]") as SVGCircleElement | null;
      const tl = gsap.timeline();

      if (ring) ring.style.strokeDasharray = `0 ${RING_LENGTH}`;

      tl.to("[data-hand]", { y: "+=900", duration: 0.55, ease: "power2.in" }, T.handDrop);
      tl.to("[data-counter]", { opacity: 0, duration: 0.35, ease: "power1.in" }, T.counter);
      blurIn(tl, q('[data-reveal="nav"]'), T.nav, 8, 0.5);
      tl.to(
        st,
        {
          expand: EXPAND_TO,
          duration: 0.7,
          ease: "power2.in",
          onComplete: () => {
            setPreloaderDone(true);
            unlockScroll();
            setIntroDone(true);
          },
        },
        T.expand,
      );
      revealChars(tl, q('[data-reveal="headline"]'), T.headline);
      blurIn(tl, q('[data-reveal="lead"]'), T.lead);
      blurIn(tl, q('[data-reveal="demo"]'), T.demo);
      if (glowRef.current) {
        tl.to(glowRef.current, { opacity: 1, duration: 0.45, ease: "power1.out" }, T.glowIn);
        tl.to(glowRef.current, { opacity: 0, duration: 0.9, ease: "power1.inOut" }, T.glowOut);
      }
      if (sceneRef.current) {
        tl.fromTo(sceneRef.current, { "--sun": 0 }, { "--sun": 1, duration: 1.1, ease: "power2.inOut" }, T.sun);
      }
      const card = q('[data-reveal="card"]');
      if (card) {
        tl.fromTo(
          card,
          { opacity: 0, filter: "blur(10px)", yPercent: 6 },
          { opacity: 1, filter: "blur(0px)", yPercent: 0, duration: 0.7, ease: "power2.out", clearProps: "filter,transform" },
          T.card,
        );
      }
      blurIn(tl, q('[data-reveal="discover"]'), T.discover);
      if (ring) {
        const v = { n: 0 };
        tl.to(
          v,
          {
            n: SCORE,
            duration: 1.2,
            ease: "power2.out",
            onUpdate: () => {
              ring.style.strokeDasharray = `${(RING_LENGTH * v.n) / 100} ${RING_LENGTH}`;
            },
          },
          T.ring,
        );
      }
    }, scope);
    return () => ctx.revert();
  }, [wiped, scope]);

  // M3 · nav theme and M4 · section 2 reveal
  useEffect(() => {
    const section = clarityRef.current;
    if (!section) return;
    let raf = 0;
    let played = false;
    let ctx: gsap.Context | null = null;
    const observers: IntersectionObserver[] = [];

    const play = () => {
      const c = gsap.context(() => {
        const heading = section.querySelector('[data-reveal="clarity-headline"]');
        const text = section.querySelector('[data-reveal="clarity-text"]');
        const cards = Array.from(section.querySelectorAll('[data-reveal="clarity-card"]'));
        if (reduced) {
          gsap.to([heading, text, ...cards], { opacity: 1, duration: 0.4, ease: "power1.out" });
          return;
        }
        const tl = gsap.timeline();
        revealChars(tl, heading, 0);
        blurIn(tl, text, 0.45);
        const rise = (el: Element) => ({
          targets: el,
          from: { opacity: 0, y: 40 },
          to: { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", clearProps: "transform" },
        });
        let k = 0;
        cards.forEach((el) => {
          const r = rise(el);
          if (el.getBoundingClientRect().top < window.innerHeight) {
            tl.fromTo(r.targets, r.from, r.to, 0.6 + 0.2 * k);
            k += 1;
          } else {
            const io = new IntersectionObserver((entries) => {
              entries.forEach((en) => {
                if (!en.isIntersecting) return;
                io.disconnect();
                c.add(() => {
                  gsap.fromTo(r.targets, r.from, r.to);
                });
              });
            });
            io.observe(el);
            observers.push(io);
          }
        });
      });
      ctx = c;
    };

    const check = () => {
      raf = 0;
      const lit = section.getBoundingClientRect().top <= window.innerHeight * LIGHT_AT;
      setTheme(lit ? "light" : "dark");
      if (lit && unlocked && !played) {
        played = true;
        play();
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    check();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observers.forEach((o) => o.disconnect());
      ctx?.revert();
    };
  }, [unlocked, reduced]);

  // Shopify mode has no section 2: "Discover more" goes to the theme's next section.
  const scrollPastSection = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const host = scope?.closest(".shopify-section") ?? scope;
    const next = host?.nextElementSibling ?? null;
    const behavior = reduced ? "auto" : "smooth";
    if (next) next.scrollIntoView({ behavior });
    else if (host) window.scrollTo({ top: host.getBoundingClientRect().bottom + window.scrollY, behavior });
  };

  const showPreloader = !reduced && !failed && !preloaderDone;

  return (
    <>
      <Scene
        nightSrc={nightSrc}
        daySrc={daySrc}
        visible={sceneVisible || plain}
        sectionRef={clarityRef}
        rootRef={sceneRef}
        glowRef={glowRef}
      />
      {!embedded && <Nav theme={theme} />}
      <main>
        <Hero onDiscover={embedded ? scrollPastSection : undefined} />
        {!embedded && <Clarity sectionRef={clarityRef} />}
      </main>
      {showPreloader && <Preloader assets={preAssets} state={stateRef} onWiped={onWiped} />}
    </>
  );
}
