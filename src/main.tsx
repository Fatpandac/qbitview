import "./App.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { scan } from "react-scan";
import router from "./router";

scan({
  enabled: true,
});

window.addEventListener("keydown", (event) => {
  if (event.metaKey && (event.key === "," || event.code === "Comma")) {
    event.preventDefault();
    router.navigate("/setting");
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
