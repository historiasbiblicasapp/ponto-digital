import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Limpa qualquer service worker antigo que possa estar causando problemas
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
