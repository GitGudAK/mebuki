import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../video/fonts";
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/fraunces/latin-700.css";
import { hideLaunchScreen } from "./platform";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

hideLaunchScreen();
