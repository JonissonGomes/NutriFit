import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { api } from './services/api'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      if ('Notification' in window && Notification.permission === 'default') {
        // solicita permissão após interação do usuário em telas autenticadas
      }
      const sub = await reg.pushManager?.getSubscription()
      if (sub) {
        void api.post('/notifications/push-token', { token: JSON.stringify(sub.toJSON()) })
      }
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

