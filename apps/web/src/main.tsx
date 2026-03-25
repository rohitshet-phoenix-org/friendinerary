import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { APIProvider } from "@vis.gl/react-google-maps";
import App from "./App";
import { AppStoreProvider } from "./lib/storeProvider";
import "./index.css";

const MAPS_KEY = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] as string ?? "";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppStoreProvider>
      <BrowserRouter>
        <APIProvider apiKey={MAPS_KEY}>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              className: "font-sans text-sm",
              success: { duration: 3000 },
              error: { duration: 5000 },
            }}
          />
        </APIProvider>
      </BrowserRouter>
    </AppStoreProvider>
  </React.StrictMode>
);
