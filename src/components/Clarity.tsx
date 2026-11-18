import type { RefObject } from "react";
import Chars from "./Chars";
import StatCard from "./StatCard";
import s from "./Clarity.module.css";

const CARDS = [
  {
    value: "73%",
    text: "Teams spend less time debating assumptions and more time acting on shared priorities.",
    index: "01",
  },
  {
    value: "3.4×",
    text: "Surface the few variables that actually matter and reduce weeks of analysis to hours.",
    index: "02",
  },
  {
    value: "91%",
    text: "Replace fragmented reports with one clear decision layer everyone can trust and follow.",
    index: "03",
  },
];

export default function Clarity({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  return (
    <section id="clarity" ref={sectionRef} className={s.section}>
      <h2 className={s.headline} aria-label="From Uncertainty to Direction" data-reveal="clarity-headline">
        <span className={s.line} data-line="" aria-hidden="true">
          <Chars text="From " />
          <span className={s.serif}>
            <Chars text="Uncertainty" />
          </span>
        </span>
        <span className={`${s.line} ${s.sky}`} data-line="" aria-hidden="true">
          <Chars text="to Direction" />
        </span>
      </h2>

      <p className={s.text} data-reveal="clarity-text">
        Clarity transforms fragmented reports, market shifts, customer behavior, and internal signals into one
        understandable picture. Instead of generating more dashboards, it creates confidence behind every decision.
      </p>

      <div className={s.cards}>
        {CARDS.map((c, i) => (
          <div key={c.index} className={s.cardWrap} data-reveal="clarity-card">
            <StatCard {...c} highlight={i === 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
