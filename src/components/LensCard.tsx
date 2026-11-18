import { useId } from "react";
import { ArrowLeft, ArrowRight } from "./Icons";
import s from "./LensCard.module.css";

const SCORE = 87;
const SIZE = 175.694;
const C = 87.847;
const R = 85.29;
export const RING_LENGTH = 2 * Math.PI * R;

const METRICS = [
  { label: "Strategy", value: "+12%" },
  { label: "Operations", value: "+9%" },
  { label: "Product", value: "+18%" },
];

export default function LensCard() {
  const gradId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <aside className={s.card} data-reveal="card">
      <div className={s.header}>
        <p className={s.title}>What you can clarify</p>
        <div className={s.rule} />
        <div className={s.row}>
          <div className={s.group}>
            <span className={s.index}>01</span>
            <span className={s.signal}>Signals aligned</span>
          </div>
          <div className={s.buttons}>
            <button type="button" className={s.button} aria-label="Previous">
              <ArrowLeft className={s.arrow} />
            </button>
            <button type="button" className={s.button} aria-label="Next">
              <ArrowRight className={s.arrow} />
            </button>
          </div>
        </div>
      </div>

      <div className={s.content}>
        <div className={s.visual}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={s.svg} aria-hidden="true">
            <defs>
              <linearGradient
                id={gradId}
                gradientUnits="userSpaceOnUse"
                x1="87.8473"
                y1="0"
                x2="19.1388"
                y2="27.334"
                gradientTransform={`rotate(90 ${C} ${C})`}
              >
                <stop offset="0" stopColor="var(--blue)" />
                <stop offset="1" stopColor="var(--blue-deep)" />
              </linearGradient>
            </defs>
            <circle cx={C} cy={C} r={C} fill="var(--glass-button)" />
            <circle
              data-ring=""
              cx={C}
              cy={C}
              r={R}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="5.12"
              strokeLinecap="butt"
              transform={`rotate(-90 ${C} ${C})`}
              strokeDasharray={`${(RING_LENGTH * SCORE) / 100} ${RING_LENGTH}`}
            />
          </svg>
          <div className={s.score}>
            <span className={s.scoreValue}>{SCORE}</span>
            <span className={s.scoreLabel}>Clarity Score</span>
          </div>
        </div>

        <dl className={s.metrics}>
          {METRICS.map((m) => (
            <div key={m.label} className={s.metric}>
              <dt>{m.label}</dt>
              <dd className={s.metricValue}>{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
