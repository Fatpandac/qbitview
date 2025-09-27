import "./App.css";
import React from "react";
import router from "./router";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { scan } from "react-scan";

scan({
  enabled: true,
})

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
