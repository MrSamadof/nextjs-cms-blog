'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { IBlog } from '@/types'
import BlogCard from '@/components/cards/blog'
import { cn } from '@/lib/utils'

interface Props {
  blogs: IBlog[]
}

type FilterKey = 'all' | 'high' | 'learn' | 'test' | string

const STATIC_FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',   label: 'Barchasi' },
  { key: 'high',  label: 'Yuqori signal' },
  { key: 'learn', label: "O'rganish" },
  { key: 'test',  label: "Sinab ko'rish" },
]

export default function BlogFeed({ blogs }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlFilter = searchParams.get('filter') ?? 'all'

  const [activeFilter, setActiveFilter] = useState<FilterKey>(urlFilter)

  // Sync when URL changes (e.g. browser back/forward)
  useEffect(() => {
    setActiveFilter(searchParams.get('filter') ?? 'all')
  }, [searchParams])

  const aiTools = useMemo(() => {
    const tools = new Set<string>()
    blogs.forEach((b) => { if (b.aiTool) tools.add(b.aiTool) })
    return Array.from(tools)
  }, [blogs])

  const filters = [
    ...STATIC_FILTERS,
    ...aiTools.map((tool) => ({ key: tool, label: tool })),
  ]

  function handleFilter(key: FilterKey) {
    setActiveFilter(key)
    if (key === 'all') {
      router.replace('/blogs', { scroll: false })
    } else {
      router.replace(`/blogs?filter=${encodeURIComponent(key)}`, { scroll: false })
    }
  }

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case 'all':   return blogs
      case 'high':  return blogs.filter((b) => b.importanceLevel === 'high')
      case 'learn': return blogs.filter((b) => b.canLearn)
      case 'test':  return blogs.filter((b) => b.canTest)
      default:      return blogs.filter((b) => b.aiTool === activeFilter)
    }
  }, [blogs, activeFilter])

  const highBlogs = filtered.filter((b) => b.importanceLevel === 'high')
  const restBlogs = filtered.filter((b) => b.importanceLevel !== 'high')

  return (
    <>
      {/* Filter Pills */}
      <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={cn(
              'flex-shrink-0 font-mono text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
              activeFilter === f.key
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-gray-400 hover:text-gray-900 dark:hover:border-zinc-500 dark:hover:text-zinc-200'
            )}
          >
            {f.label}
          </button>
        ))}

        {/* Clear filter button — shown when a filter is active */}
        {activeFilter !== 'all' && (
          <button
            onClick={() => handleFilter('all')}
            className='flex-shrink-0 font-mono text-xs px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150'
          >
            ✕ Tozalash
          </button>
        )}
      </div>

      {/* Blog Grid */}
      {filtered.length === 0 ? (
        <p className='font-mono text-sm text-zinc-500 text-center py-16'>
          Hech narsa topilmadi.
        </p>
      ) : (
        <div className='grid md:grid-cols-2 gap-6 mt-6'>
          {highBlogs.map((blog) => (
            <div key={blog.slug} className='md:col-span-2'>
              <BlogCard {...blog} />
            </div>
          ))}
          {restBlogs.map((blog) => (
            <div key={blog.slug} className='md:col-span-1'>
              <BlogCard {...blog} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
