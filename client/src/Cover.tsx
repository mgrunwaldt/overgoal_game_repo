import { useState } from "react";
import "./Cover.css";

export default function Cover({ onConnect }: { onConnect: () => void }) {
  const [connected, setConnected] = useState(false);

  const handleConnect = () => {
    setConnected(true);
    onConnect();
  };

  return (
    <div className="container">
      {!connected ? (
        <div>
          <h1>Welcome</h1>
          <button onClick={handleConnect}>Conectar</button>
        </div>
      ) : null}
    </div>
  );
}
