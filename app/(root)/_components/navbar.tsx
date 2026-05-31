// FILE: app/(root)/_components/navbar.tsx
'use client'

import { cn } from '@/lib/utils'
import { navLinks } from '@/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import ModeToggle from '@/components/shared/mode-toggle'
import Globalsearch from './global-search'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

function Navbar() {
  const pathName = usePathname()

  return (
    <header className='h-14 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 fixed inset-x-0 top-0 z-40'>
      <div className='max-w-6xl mx-auto px-4 h-full flex items-center justify-between'>
        {/* Logo */}
        <Link href='/' className='flex items-center'>
          <span className='font-createRound text-lg text-zinc-100'>
            SamoDev
          </span>
          <span className='text-green-500 animate-[blink_1s_step-end_infinite] font-createRound text-lg ml-0.5'>
            ▮
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className='hidden md:flex items-center gap-1'>
          {navLinks.map((nav) => {
            const isActive = pathName === nav.route
            return (
              <Link
                key={nav.route}
                href={nav.route}
                className={cn(
                  'font-workSans text-sm px-3 py-1 transition-colors',
                  isActive
                    ? 'text-zinc-100 border-b-2 border-green-500 pb-[1px]'
                    : 'text-zinc-400 hover:text-zinc-100'
                )}
              >
                {nav.name}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className='flex items-center gap-1'>
          <Globalsearch />
          <ModeToggle />

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className='md:hidden flex items-center justify-center w-9 h-9 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors'
                aria-label='Open menu'
              >
                <Menu className='w-5 h-5' />
              </button>
            </SheetTrigger>
            <SheetContent
              side='right'
              className='bg-zinc-950 border-zinc-800 p-0 w-72'
            >
              <VisuallyHidden>
                <SheetTitle>Navigation menu</SheetTitle>
              </VisuallyHidden>
              <div className='flex flex-col h-full'>
                {/* Mobile sheet header */}
                <div className='flex items-center justify-between px-5 h-14 border-b border-zinc-800'>
                  <Link href='/' className='flex items-center'>
                    <span className='font-createRound text-base text-zinc-100'>
                      SamoDev
                    </span>
                    <span className='text-green-500 animate-[blink_1s_step-end_infinite] font-createRound text-base ml-0.5'>
                      ▮
                    </span>
                  </Link>
                </div>

                {/* Mobile nav links */}
                <nav className='flex flex-col gap-1 p-4'>
                  {navLinks.map((nav) => {
                    const isActive = pathName === nav.route
                    return (
                      <SheetClose key={nav.route} asChild>
                        <Link
                          href={nav.route}
                          className={cn(
                            'font-workSans text-sm px-3 py-2.5 rounded-md transition-colors flex items-center gap-3',
                            isActive
                              ? 'text-zinc-100 bg-zinc-800'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                          )}
                        >
                          {nav.icon && (
                            <nav.icon className='w-4 h-4 flex-shrink-0' />
                          )}
                          {nav.name}
                        </Link>
                      </SheetClose>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Navbar
