import { ArrowUpRight } from "./Icons";
import s from "./Nav.module.css";

const LOGO = "https://assets.uberdesigner.ai/lucid/logo.svg";
const LOGO_DARK = "https://assets.uberdesigner.ai/lucid/logo-dark.svg";
const LINKS = ["Main", "Experience", "Destinations", "Voyages", "Journal"];

export default function Nav({ theme }: { theme: "dark" | "light" }) {
  return (
    <nav className={s.nav} data-theme={theme} data-reveal="nav">
      <a href="#top" className={s.logo} aria-label="lucid">
        <img src={LOGO} alt="" className={s.logoLight} />
        <img src={LOGO_DARK} alt="" className={s.logoDark} />
      </a>
      <div className={s.pill}>
        {LINKS.map((l) => (
          <a key={l} href="#" className={s.link}>
            {l}
          </a>
        ))}
      </div>
      <a href="#" className={s.schedule}>
        <span className={s.label}>Look at schedule</span>
        <span className={s.circle}>
          <ArrowUpRight className={s.icon} />
        </span>
      </a>
    </nav>
  );
}
