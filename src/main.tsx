import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
        // Check if service worker is active
        if (registration.active) {
          console.log('Service worker is active!');
        } else {
          console.log('Service worker is not active. Check console for errors.');
        }
      })
      .catch(registrationError => {
        console.error('SW registration failed:', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);