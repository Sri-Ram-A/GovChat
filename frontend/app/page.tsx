'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/main')
  }, [router])

  return (
    <div className="h-screen w-screen bg-black" />
  )
}
