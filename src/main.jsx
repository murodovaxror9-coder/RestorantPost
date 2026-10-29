import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { installGlobalErrorLogging } from './utils/errorLog';
import './index.css';

installGlobalErrorLogging();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Yangi versiya topilsa — foydalanuvchiga xabar beramiz (App.jsx'dagi UpdateBanner ko'rsatadi)
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('restropos:update-available', { detail: { worker } }));
          }
        });
      });
    }).catch(() => {
      /* PWA ro'yxatdan o'tmadi — ilova baribir oddiy rejimda ishlayveradi */
    });
  });
}
