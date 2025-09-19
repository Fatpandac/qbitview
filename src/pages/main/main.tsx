import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

function Main() {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    invoke<string>("get_version")
      .then((v) => {
        setVersion(v);
      })
      .catch((e) => {
        console.error(e);
      });
  }, []);

  return (
    <div className="h-screen w-screen flex justify-center items-center ">
      Main Page - qbitorrent version: {version}
    </div>
  );
}

export default Main;
