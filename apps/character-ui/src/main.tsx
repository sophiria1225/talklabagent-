import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App.js";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("[ui] root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
