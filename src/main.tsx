import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getStorageAdapter } from './lib/storage';

async function bootstrap() {
  // Pre-warm storage adapter (Capacitor needs async init; web is instant)
  await getStorageAdapter();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
