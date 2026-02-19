import React from "react";
import ReactDOM from "react-dom/client";
import DashboardApp from "./DashboardApp";
import "../styles/index.css";

ReactDOM.createRoot(document.getElementById("dashboard-root")!).render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>
);