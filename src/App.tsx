import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

function App() {
  const [loginInfo, setLoginInfo] = useState<{
    username: string;
    password: string;
  }>({
    username: "",
    password: "",
  });
  const [loginMsg, setLoginMsg] = useState("");

  async function login() {
    try {
      const { username, password } = loginInfo;
      const res = await invoke<string>("login", { username, password });
      setLoginMsg(res);
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
            id="greet-input"
            onChange={(e) =>
              setLoginInfo({
                ...loginInfo!,
                username: e.currentTarget.value,
              })
            }
            placeholder="Enter a username..."
          />
          <Input
            id="greet-input"
            onChange={(e) =>
              setLoginInfo({
                ...loginInfo!,
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
      <p>{loginMsg}</p>
    </main>
  );
}

export default App;
