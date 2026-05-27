'use client'
import { useTheme } from 'next-themes'
import { Button } from '../ui/button'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

function ModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  // Komponent mount bo'lgandan keyin mounted ni true qilish
  useEffect(() => {
    setMounted(true)
  }, [])

  // Agar hali mount bo'lmagan bo'lsa, hech narsa ko'rsatmaymiz
  if (!mounted) {
    return null
  }

  return resolvedTheme === 'dark' ? (
    <Button size={'icon'} variant={'ghost'} onClick={() => setTheme('light')}>
      <Sun />
    </Button>
  ) : (
    <Button size={'icon'} variant={'ghost'} onClick={() => setTheme('dark')}>
      <Moon />
    </Button>
  )
}

export default ModeToggle