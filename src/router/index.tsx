import App from "@/App.tsx";
import { lazy } from "react";
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/main",
    Component: lazy(() => import("@/pages/main/main.tsx")),
  },
  {
    path: "/setting",
    Component: lazy(() => import("@/pages/setting/setting.tsx")),
  },
  {
    path: "*",
    Component: () => (
      <div className="w-screen h-screen flex justify-center items-center">
        404 Not Found
      </div>
    ),
  },
]);

export default router;
