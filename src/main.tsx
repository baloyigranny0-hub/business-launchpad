import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Foundry could not start because the app container is missing.");
createRoot(root).render(<App />);
