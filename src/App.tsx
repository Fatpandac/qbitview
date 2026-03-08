import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Navigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import useUser from "./sotres/user";
import router from "./router";

const DEV_DOMAIN = import.meta.env.VITE_DEV_DOMAIN as string | undefined;
const DEV_USERNAME = import.meta.env.VITE_DEV_USERNAME as string | undefined;
const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD as string | undefined;
const DEV_AUTO_LOGIN = import.meta.env.DEV && DEV_DOMAIN && DEV_USERNAME && DEV_PASSWORD;

function App() {
  const { authorized, setAuthorized } = useUser();
  const [loginMsg, setLoginMsg] = useState("");
  const [loginInfo, setLoginInfo] = useState({
    username: DEV_USERNAME ?? "",
    password: DEV_PASSWORD ?? "",
    domain: DEV_DOMAIN ?? "",
  });

  useEffect(() => {
    if (DEV_AUTO_LOGIN && !authorized) {
      invoke("login", {
        username: DEV_USERNAME,
        password: DEV_PASSWORD,
        domain: DEV_DOMAIN,
      })
        .then(() => {
          setAuthorized(true);
          router.navigate("/main");
        })
        .catch((e) => setLoginMsg("Auto-login failed: " + e));
    }
  }, []);

  if (authorized) {
    return <Navigate to="/main" replace />;
  }

  async function login() {
    try {
      const { username, password, domain } = loginInfo;
      await invoke("login", { username, password, domain });
      setAuthorized(true);
      router.navigate("/main");
    } catch (e) {
      setLoginMsg("Login failed: " + e);
      let timer = setTimeout(() => {
        setLoginMsg("");
        clearTimeout(timer);
      }, 3000);
      return;
    }
  }

  return (
    <main className="w-screen h-screen flex flex-col justify-center items-center gap-4">
      <h1>qBitView</h1>

      <p>A qbittorrent client via Tauri</p>

      <form
        className="flex flex-row gap-2 w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
      >
        <div className="flex flex-col gap-2 w-4/5">
          <Input
            type="url"
            defaultValue={loginInfo.domain || "http://localhost:8080"}
            onChange={(e) =>
              setLoginInfo({
                ...loginInfo,
                domain: e.currentTarget.value,
              })
            }
            placeholder="Enter domain (with http/https) ..."
          />
          <Input
            defaultValue={loginInfo.username}
            onChange={(e) =>
              setLoginInfo({
                ...loginInfo,
                username: e.currentTarget.value,
              })
            }
            placeholder="Enter a username..."
          />
          <Input
            type="password"
            defaultValue={loginInfo.password}
            onChange={(e) =>
              setLoginInfo({
                ...loginInfo,
                password: e.currentTarget.value,
              })
            }
            placeholder="Enter a password..."
          />
        </div>
        <Button className="h-full flex-1" type="submit">
          Login
        </Button>
      </form>
      {DEV_AUTO_LOGIN && (
        <p className="text-xs text-muted-foreground">
          Dev mode: auto-logging in as <span className="font-medium">{DEV_USERNAME}</span> @ {DEV_DOMAIN}
        </p>
      )}
      <Alert
        variant="destructive"
        className="fixed bottom-4 right-4 w-80"
        hidden={!loginMsg}
      >
        <AlertTitle>Login failed</AlertTitle>
        <AlertDescription>{loginMsg}</AlertDescription>
      </Alert>
    </main>
  );
}

export default App;
