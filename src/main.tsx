import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Remove initial loader once React is ready to render
const initialLoader = document.getElementById('initial-loader');
if (initialLoader) {
  initialLoader.style.opacity = '0';
  initialLoader.style.transition = 'opacity 0.5s ease-out';
  setTimeout(() => {
    initialLoader.remove();
  }, 500);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
