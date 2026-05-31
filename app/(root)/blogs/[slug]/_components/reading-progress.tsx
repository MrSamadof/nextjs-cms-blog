// FILE: app/(root)/blogs/[slug]/_components/reading-progress.tsx
'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY
      const documentHeight = document.documentElement.scrollHeight
      const windowHeight = window.innerHeight
      const total = documentHeight - windowHeight

      if (total <= 0) {
        setProgress(100)
        return
      }

      setProgress(Math.min(100, (scrollY / total) * 100))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      style={{ width: `${progress}%` }}
      className='fixed top-14 left-0 h-[2px] bg-green-500 z-50 transition-[width] duration-100'
    />
  )
}
