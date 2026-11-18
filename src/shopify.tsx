import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css"; // rewritten to `.lucid-root` in the Shopify build (see vite.config.ts)
import "./styles/embed.css";
import Page from "./components/Page";

// Shopify entry: plays lucid's hero as a full-screen intro over the theme's home page,
// then removes itself. The section's inline script has already removed the element for
// returning visitors, reduced motion and the theme editor.
const SEEN_KEY = "lucid-intro-seen";
const el = document.querySelector<HTMLElement>("[data-lucid]");

if (el) {
  const root = createRoot(el);
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // storage blocked: the intro simply plays again next time
    }
    setTimeout(() => {
      root.unmount();
      el.remove();
      document.documentElement.style.overflow = "";
      window.scrollTo(0, 0);
    }, 0);
  };
  root.render(
    <StrictMode>
      <Page embedded scope={el} onIntroEnd={end} />
    </StrictMode>,
  );
}
