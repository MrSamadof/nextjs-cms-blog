// FILE: app/(root)/_components/footer.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { navLinks } from '@/constants'

function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = () => {
    if (!email.includes('@')) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className='bg-zinc-900 border-t border-zinc-800 py-8 px-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Three-column grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 items-start'>
          {/* Left — Logo + tagline */}
          <div className='flex flex-col gap-2'>
            <Link href='/' className='inline-flex items-center'>
              <span className='font-createRound text-base text-zinc-400'>
                SamoDev
              </span>
              <span className='text-green-500 animate-[blink_1s_step-end_infinite] font-createRound text-base ml-0.5'>
                ▮
              </span>
            </Link>
            <p className='font-workSans text-xs text-zinc-600 mt-1 max-w-[200px]'>
              Curated AI signal, no noise.
            </p>
            <nav className='flex flex-col gap-1 mt-2'>
              {navLinks.slice(0, 4).map((nav) => (
                <Link
                  key={nav.route}
                  href={nav.route}
                  className='font-workSans text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-fit'
                >
                  {nav.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center — Email subscription */}
          <div className='flex flex-col gap-3'>
            <p className='font-workSans text-sm text-zinc-300'>
              Yangi postlardan xabardor bo&apos;ling
            </p>
            <p className='font-workSans text-xs text-zinc-500'>
              Spam yo&apos;q. Faqat muhim signallar.
            </p>
            {subscribed ? (
              <p className='font-mono text-xs text-green-400 mt-1'>
                ✓ Obuna bo&apos;ldingiz!
              </p>
            ) : (
              <div className='flex gap-2 mt-1'>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  placeholder='email@misol.uz'
                  className='bg-zinc-800 border border-zinc-700 text-zinc-300 placeholder:text-zinc-600 rounded-md focus:border-zinc-500 text-sm h-9 flex-1'
                />
                <Button
                  size='sm'
                  onClick={handleSubscribe}
                  className='bg-green-500 hover:bg-green-400 text-zinc-950 font-workSans font-semibold h-9 px-4 flex-shrink-0'
                >
                  Obuna
                </Button>
              </div>
            )}
          </div>

          {/* Right — Copyright */}
          <div className='flex flex-col gap-2 md:items-end'>
            <p className='font-mono text-xs text-zinc-600'>
              &copy; {new Date().getFullYear()} SamoDev
            </p>
            <p className='font-mono text-xs text-zinc-600'>
              Barcha huquqlar himoyalangan.
            </p>
            <p className='font-mono text-xs text-zinc-700 mt-1'>
              Built with Next.js &amp; Hygraph
            </p>
          </div>
        </div>

        {/* Bottom divider */}
        <div className='border-t border-zinc-800 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-2'>
          <p className='font-mono text-xs text-zinc-700'>
            Agents. Automation. Tools.
          </p>
          <p className='font-mono text-xs text-zinc-700'>
            sabran2233@gmail.com
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
