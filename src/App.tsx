import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [loginMsg, setLoginMsg] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    try {
      const res = await invoke<string>("login", { username, password })
      setLoginMsg(res);
    } catch (e) {
      setLoginMsg("Login failed: " + e);
      let timer = setTimeout(() => {
        setLoginMsg("");
        clearTimeout(timer);
      }, 3000)
      return;
    }
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          login();
        }}
      >
        <div className="flex flex-col gap-2">
          <input
            id="greet-input"
            onChange={(e) => setUsername(e.currentTarget.value)}
            placeholder="Enter a username..."
          />
          <input
            id="greet-input"
            onChange={(e) => setPassword(e.currentTarget.value)}
            placeholder="Enter a password..."
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>{loginMsg}</p>
    </main>
  );
}

export default App;
