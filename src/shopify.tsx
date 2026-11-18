import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tokens.css"; // rewritten to `.lucid-root` in the Shopify build (see vite.config.ts)
import "./styles/embed.css";
import Page from "./components/Page";

// Shopify entry: mounts lucid inside the theme's `lucid` section, leaving the rest of the page alone.
const el = document.querySelector<HTMLElement>("[data-lucid]");
if (el) {
  el.classList.add("lucid-root");
  createRoot(el).render(
    <StrictMode>
      <Page embedded scope={el} />
    </StrictMode>,
  );
}
