import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./redesign.css";
import {design} from "./design-config";
document.documentElement.dataset.design=design.id;
for(const [key,value] of Object.entries(design.css)) document.documentElement.style.setProperty(key,value);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
