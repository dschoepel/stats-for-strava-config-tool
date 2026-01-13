'use client'

import App from '../src/App'
import { ClientOnly } from './_components/ui/ClientOnly'

export default function Home() {
  return (
    <ClientOnly>
      <App />
    </ClientOnly>
  )
}