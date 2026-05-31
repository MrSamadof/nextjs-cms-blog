// FILE: app/(root)/(home)/page.tsx

export const dynamic = 'force-dynamic'

import { getBlogs } from '@/service/blog.service'
import { IBlog } from '@/types'
import Link from 'next/link'
import BlogFeed from './_components/blog-feed'

function computeStats(blogs: IBlog[]) {
  const total = blogs.length
  const high = blogs.filter((b) => b.importanceLevel === 'high').length
  const medium = blogs.filter((b) => b.importanceLevel === 'medium').length
  const low = blogs.filter((b) => b.importanceLevel === 'low').length
  const canLearn = blogs.filter((b) => b.canLearn).length
  const canTest = blogs.filter((b) => b.canTest).length

  const toolMap: Record<string, number> = {}
  blogs.forEach((b) => {
    if (b.aiTool) {
      toolMap[b.aiTool] = (toolMap[b.aiTool] ?? 0) + 1
    }
  })

  return { total, high, medium, low, canLearn, canTest, toolMap }
}

export default async function HomePage() {
  const blogs = await getBlogs()
  const stats = computeStats(blogs)

  // Build flat list of stat items for staggered animation
  const statItems = [
    { label: 'Jami:', value: String(stats.total), valueClass: 'text-zinc-300' },
    { label: 'High:', value: String(stats.high), valueClass: 'text-orange-400' },
    { label: 'Medium:', value: String(stats.medium), valueClass: 'text-zinc-300' },
    { label: 'Low:', value: String(stats.low), valueClass: 'text-zinc-300' },
    { label: "O'rganish:", value: String(stats.canLearn), valueClass: 'text-zinc-300' },
    { label: 'Sinab:', value: String(stats.canTest), valueClass: 'text-zinc-300' },
    ...Object.entries(stats.toolMap).map(([tool, count]) => ({
      label: `${tool}:`,
      value: String(count),
      valueClass: 'text-zinc-300',
    })),
  ]

  return (
    <div className='min-h-screen'>
      {/* ── Hero ────────────────────────────────────── */}
      <section className='max-w-6xl mx-auto px-4 pt-24 pb-12 min-h-[40dvh] flex items-center'>
        <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-10 w-full'>
          {/* Left — headline + CTAs */}
          <div className='flex flex-col gap-5 max-w-xl'>
            <h1 className='font-createRound text-5xl md:text-6xl lg:text-7xl text-zinc-900 dark:text-zinc-100 leading-tight'>
              SamoDev
            </h1>
            <p className='font-mono text-zinc-500 text-base tracking-widest uppercase'>
              Agents. Automation. Tools.
            </p>
            <p className='font-workSans text-zinc-400 text-lg'>
              Curated AI signal, no noise.
            </p>
            <div className='flex flex-wrap gap-3 mt-2'>
              <Link
                href='/blogs'
                className='inline-flex items-center px-5 py-2.5 rounded-md bg-green-500 text-zinc-950 font-workSans font-semibold text-sm hover:bg-green-400 transition-colors'
              >
                Barcha postlar
              </Link>
              <Link
                href='/contact'
                className='inline-flex items-center px-5 py-2.5 rounded-md border border-zinc-700 text-zinc-300 font-workSans text-sm hover:border-zinc-500 hover:text-zinc-100 transition-colors'
              >
                Obuna bo&apos;lish
              </Link>
            </div>
          </div>

          {/* Right — stats panel (desktop only) */}
          <div className='hidden md:flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-md p-5 min-w-[220px] self-center'>
            <p className='font-mono text-xs text-zinc-600 uppercase tracking-widest mb-1'>
              Signal Stats
            </p>
            <StatRow label='Jami postlar' value={String(stats.total)} />
            <StatRow
              label='High Signal'
              value={String(stats.high)}
              valueClass='text-orange-400'
            />
            <StatRow label='Medium' value={String(stats.medium)} valueClass='text-yellow-500' />
            <StatRow label='Low' value={String(stats.low)} valueClass='text-zinc-500' />
            <StatRow label='O&apos;rganish' value={String(stats.canLearn)} valueClass='text-green-400' />
            <StatRow label='Sinab ko&apos;rish' value={String(stats.canTest)} valueClass='text-green-400' />
            {Object.entries(stats.toolMap).map(([tool, count]) => (
              <StatRow key={tool} label={tool} value={String(count)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────── */}
      <div className='bg-zinc-900 border-y border-zinc-800 py-3 px-4 overflow-x-auto'>
        <div className='max-w-6xl mx-auto flex items-center gap-6 font-mono text-xs whitespace-nowrap'>
          {statItems.map((item, i) => (
            <span
              key={item.label}
              className='opacity-0 animate-[fadeIn_0.4s_ease_forwards]'
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className='text-zinc-600'>{item.label} </span>
              <span className={item.valueClass}>{item.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Feed ───────────────────────────────────── */}
      <section className='max-w-6xl mx-auto px-4 pt-8 pb-20'>
        <BlogFeed blogs={blogs} />
      </section>
    </div>
  )
}

function StatRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <span
        className='font-mono text-xs text-zinc-600'
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <span className={`font-mono text-xs ${valueClass ?? 'text-zinc-300'}`}>
        {value}
      </span>
    </div>
  )
}
