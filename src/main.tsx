import "./App.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import router from "./router";
import { initTheme } from "./lib/theme";
import { initLanguage } from "./lib/language";
import { ExitDialog } from "./components/ExitDialog";

if (import.meta.env.DEV) {
  import("react-scan").then(({ scan }) => scan({ enabled: true }));
  import("react-grab");
}

initTheme();
initLanguage();

window.addEventListener("keydown", (event) => {
  if (event.metaKey && (event.key === "," || event.code === "Comma")) {
    event.preventDefault();
    router.navigate("/setting");
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ExitDialog />
    <RouterProvider router={router} />
  </React.StrictMode>,
);
