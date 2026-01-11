'use client'

import App from '../src/App'
import { ClientOnly } from '../src/components/ClientOnly'

export default function Home() {
  return (
    <ClientOnly>
      <App />
    </ClientOnly>
  )
}