// FILE: app/(root)/(home)/_components/blog-feed.tsx
'use client'

import { useState, useMemo } from 'react'
import { IBlog } from '@/types'
import BlogCard from '@/components/cards/blog'
import { cn } from '@/lib/utils'

interface Props {
  blogs: IBlog[]
}

type FilterKey = 'all' | 'high' | 'learn' | 'test' | string

const STATIC_FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'high', label: 'Yuqori signal' },
  { key: 'learn', label: "O'rganish" },
  { key: 'test', label: "Sinab ko'rish" },
]

export default function BlogFeed({ blogs }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  // Collect unique AI tools
  const aiTools = useMemo(() => {
    const tools = new Set<string>()
    blogs.forEach((b) => {
      if (b.aiTool) tools.add(b.aiTool)
    })
    return Array.from(tools)
  }, [blogs])

  const filters = [
    ...STATIC_FILTERS,
    ...aiTools.map((tool) => ({ key: tool, label: tool })),
  ]

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case 'all':
        return blogs
      case 'high':
        return blogs.filter((b) => b.importanceLevel === 'high')
      case 'learn':
        return blogs.filter((b) => b.canLearn)
      case 'test':
        return blogs.filter((b) => b.canTest)
      default:
        // treat as an AI tool name
        return blogs.filter((b) => b.aiTool === activeFilter)
    }
  }, [blogs, activeFilter])

  // Split HIGH from the rest — HIGH come first and are full-width
  const highBlogs = filtered.filter((b) => b.importanceLevel === 'high')
  const restBlogs = filtered.filter((b) => b.importanceLevel !== 'high')

  return (
    <>
      {/* Filter Pills */}
      <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
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
      </div>

      {/* Blog Grid */}
      {filtered.length === 0 ? (
        <p className='font-mono text-sm text-zinc-500 text-center py-16'>
          Hech narsa topilmadi.
        </p>
      ) : (
        <div className='grid md:grid-cols-2 gap-6 mt-6'>
          {/* HIGH importance — full-width col-span-2 */}
          {highBlogs.map((blog) => (
            <div key={blog.slug} className='col-span-2'>
              <BlogCard {...blog} />
            </div>
          ))}
          {/* Standard cards — 1-column each */}
          {restBlogs.map((blog) => (
            <div key={blog.slug} className='col-span-1'>
              <BlogCard {...blog} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
