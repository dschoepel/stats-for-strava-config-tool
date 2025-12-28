'use client'

import App from '../src/App'
import { ToastProvider } from '../src/contexts/ToastContext'

export default function Home() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  )
}