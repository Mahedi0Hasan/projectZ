import { useId } from "react";
import s from "./StatCard.module.css";

const OUTLINE =
  "M0 28C0 12.536 12.536 0 28 0H345.455C352.252 0 358.817 2.472 363.925 6.956L438.47 72.386" +
  "C444.527 77.702 448 85.37 448 93.43V375C448 390.464 435.464 403 420 403H102.545" +
  "C95.748 403 89.183 400.528 84.075 396.044L9.53 330.614C3.473 325.298 0 317.63 0 309.57V28Z";

type Props = { value: string; text: string; index: string; highlight?: boolean };

export default function StatCard({ value, text, index, highlight = false }: Props) {
  const id = `card-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div className={`${s.card} ${highlight ? s.highlight : ""}`}>
      <svg className={s.bg} viewBox="0 0 448 403" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {highlight ? (
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="224" y1="0" x2="253.204" y2="400.872">
              <stop offset="0" stopColor="var(--blue)" />
              <stop offset="1" stopColor="var(--blue-pale)" />
            </linearGradient>
          ) : (
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="224" y1="0" x2="224" y2="403">
              <stop offset="0" stopColor="var(--card-top)" />
              <stop offset="1" stopColor="var(--card-bottom)" />
            </linearGradient>
          )}
        </defs>
        <path d={OUTLINE} fill={`url(#${id})`} />
      </svg>
      <p className={s.value}>{value}</p>
      <p className={s.text}>{text}</p>
      <p className={s.index}>{index}</p>
    </div>
  );
}
