import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";


// IMPORTANT: only Groomup styles
import "./assets/styles/variables.css";
import "./assets/styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
