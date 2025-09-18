import App from "@/App.tsx";
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
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
