import Chars from "./Chars";
import LensCard from "./LensCard";
import { ArrowUpRight } from "./Icons";
import s from "./Hero.module.css";

export default function Hero() {
  return (
    <section id="top" className={s.hero}>
      <h1 className={s.headline} aria-label="See Beyond What’s Unclear" data-reveal="headline">
        <span className={s.line} data-line="" aria-hidden="true">
          <Chars text="See " />
          <span className={s.serif}>
            <Chars text="Beyond" />
          </span>
        </span>
        <span className={`${s.line} ${s.line2}`} data-line="" aria-hidden="true">
          <Chars text="What’s Unclear" />
        </span>
      </h1>

      <div className={s.lead} data-reveal="lead">
        <p>Business decisions rarely fail because information is missing.</p>
        <p>They fail because everything appears equally important. Clarity reveals what deserves attention.</p>
      </div>

      <div className={s.demoRow}>
        <a href="#" className={s.demo} data-reveal="demo">
          <span className={s.demoLabel}>Watch Demo</span>
          <span className={s.demoArrow}>
            <ArrowUpRight className={s.icon} />
          </span>
        </a>
      </div>

      <LensCard />

      <a href="#clarity" className={s.discover} data-reveal="discover">
        <span className={s.discoverPill} aria-hidden="true">
          ↓
        </span>
        <span className={s.discoverText}>Discover more</span>
      </a>
    </section>
  );
}
