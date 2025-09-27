import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Navigate } from "react-router";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import useUser from "./sotres/user";
import router from "./router";

function App() {
  const { authorized, setAuthorized } = useUser();
  const [loginMsg, setLoginMsg] = useState("");
  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: "",
    domain: "",
  });

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
            defaultValue="http://localhost:8080"
            onChange={(e) =>
              setLoginInfo({
                ...loginInfo,
                domain: e.currentTarget.value,
              })
            }
            placeholder="Enter domain (with http/https) ..."
          />
          <Input
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
