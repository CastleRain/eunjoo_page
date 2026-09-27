import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./redesign.css";
import {design} from "./design-config";
document.documentElement.dataset.design=design.id;
for(const [key,value] of Object.entries(design.css)) document.documentElement.style.setProperty(key,value);

const root = document.getElementById("root");
if (!root) throw new Error("앱을 표시할 root 요소가 없습니다.");
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
