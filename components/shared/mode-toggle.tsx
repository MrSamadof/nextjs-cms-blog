'use client'
import { useTheme } from 'next-themes'
import { Button } from '../ui/button'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

function ModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className='w-9 h-9' />
  }

  return resolvedTheme === 'dark' ? (
    <Button
      size='icon'
      variant='ghost'
      onClick={() => setTheme('light')}
      className='text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
    >
      <Sun className='w-4 h-4' />
    </Button>
  ) : (
    <Button
      size='icon'
      variant='ghost'
      onClick={() => setTheme('dark')}
      className='text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    >
      <Moon className='w-4 h-4' />
    </Button>
  )
}

export default ModeToggle
