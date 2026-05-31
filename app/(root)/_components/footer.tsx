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
    <footer className='bg-gray-100 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 py-8 px-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Three-column grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 items-start'>
          {/* Left — Logo + tagline */}
          <div className='flex flex-col gap-2'>
            <Link href='/' className='inline-flex items-center'>
              <span className='font-createRound text-base text-gray-700 dark:text-zinc-400'>
                SamoDev
              </span>
            </Link>
            <p className='font-workSans text-xs text-gray-500 dark:text-zinc-600 mt-1 max-w-[200px]'>
              Curated AI signal, no noise.
            </p>
            <nav className='flex flex-col gap-1 mt-2'>
              {navLinks.slice(0, 4).map((nav) => (
                <Link
                  key={nav.route}
                  href={nav.route}
                  className='font-workSans text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-300 transition-colors w-fit'
                >
                  {nav.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center — Email subscription */}
          <div className='flex flex-col gap-3'>
            <p className='font-workSans text-sm text-gray-700 dark:text-zinc-300'>
              Yangi postlardan xabardor bo&apos;ling
            </p>
            <p className='font-workSans text-xs text-gray-500 dark:text-zinc-500'>
              Spam yo&apos;q. Faqat muhim signallar.
            </p>
            {subscribed ? (
              <p className='font-mono text-xs text-green-600 dark:text-green-400 mt-1'>
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
                  className='bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-300 placeholder:text-gray-400 dark:placeholder:text-zinc-600 rounded-md text-sm h-9 flex-1'
                />
                <Button
                  size='sm'
                  onClick={handleSubscribe}
                  className='bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-400 text-white dark:text-zinc-950 font-workSans font-semibold h-9 px-4 flex-shrink-0'
                >
                  Obuna
                </Button>
              </div>
            )}
          </div>

          {/* Right — Copyright */}
          <div className='flex flex-col gap-2 md:items-end'>
            <p className='font-mono text-xs text-gray-500 dark:text-zinc-600'>
              &copy; {new Date().getFullYear()} SamoDev
            </p>
            <p className='font-mono text-xs text-gray-500 dark:text-zinc-600'>
              Barcha huquqlar himoyalangan.
            </p>
            <p className='font-mono text-xs text-gray-400 dark:text-zinc-700 mt-1'>
              Built with Next.js &amp; Hygraph
            </p>
          </div>
        </div>

        {/* Bottom divider */}
        <div className='border-t border-gray-200 dark:border-zinc-800 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-2'>
          <p className='font-mono text-xs text-gray-400 dark:text-zinc-700'>
            Agents. Automation. Tools.
          </p>
          <p className='font-mono text-xs text-gray-400 dark:text-zinc-700'>
            sabran2233@gmail.com
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
