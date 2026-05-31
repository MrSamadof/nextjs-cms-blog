// FILE: components/cards/blog.tsx
import { IBlog } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { cn, getReadingTime } from '@/lib/utils'
import { format } from 'date-fns'

const HYGRAPH_FALLBACK =
  'https://us-west-2.graphassets.com/cmgfe2kkj071x07n6dup74m4b/cmgpavuhj7r2907n8bedqoubp'

const AI_TOOL_FALLBACKS: Record<string, string> = {
  claude:  '/fallbacks/claude.svg',
  gpt:     '/fallbacks/gpt.svg',
  openai:  '/fallbacks/gpt.svg',
  gemini:  '/fallbacks/gemini.svg',
}

function getFallbackImage(aiTool?: string | null): string {
  if (!aiTool) return '/fallbacks/default.svg'
  const key = aiTool.toLowerCase()
  for (const [match, path] of Object.entries(AI_TOOL_FALLBACKS)) {
    if (key.includes(match)) return path
  }
  return '/fallbacks/default.svg'
}

function getAiToolBadgeClass(tool: string): string {
  const t = tool.toLowerCase()
  if (t.includes('claude'))
    return 'bg-violet-950 text-violet-300 border-violet-800'
  if (t.includes('gpt') || t.includes('openai'))
    return 'bg-emerald-950 text-emerald-300 border-emerald-800'
  if (t.includes('gemini'))
    return 'bg-blue-950 text-blue-300 border-blue-800'
  return 'bg-zinc-800 text-zinc-400 border-zinc-700'
}

interface Props extends IBlog {
  isVertical?: boolean
}

function BlogCard(blog: Props) {
  const isHigh = blog.importanceLevel === 'high'
  const readingTime = getReadingTime(blog.content?.html ?? '')

  if (isHigh) {
    // HIGH importance — horizontal layout, full-width featured card
    return (
      <Link href={`/blogs/${blog.slug}`} className='block group'>
        <article
          className={cn(
            'bg-zinc-900 border border-zinc-800 border-l-[3px] border-l-orange-500 rounded-md',
            'hover:border-zinc-600 hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer',
            'hover:translate-y-[-2px] hover:shadow-[0_0_0_1px_theme(colors.orange.800)]',
            'flex flex-col md:flex-row overflow-hidden'
          )}
        >
          {/* Image — left side on desktop */}
          <div className='md:w-2/5 flex-shrink-0 overflow-hidden'>
            <div className='relative w-full h-52 md:h-full min-h-[200px]'>
              <Image
                src={blog.image?.url ?? getFallbackImage(blog.aiTool)}
                alt={blog.title}
                fill
                className='object-cover group-hover:scale-[1.02] transition-transform duration-300'
              />
            </div>
          </div>

          {/* Content — right side */}
          <div className='flex flex-col gap-3 p-5 flex-1'>
            {/* TOP ROW: HIGH badge + AI tool badge */}
            <div className='flex flex-wrap items-center gap-2'>
              <span className='font-mono text-xs text-orange-400 bg-orange-950 border border-orange-800 px-2 py-0.5 rounded'>
                <span className='animate-pulse'>▮</span> HIGH SIGNAL
              </span>
              {blog.aiTool && (
                <span
                  className={cn(
                    'font-mono text-xs px-2 py-0.5 rounded border',
                    getAiToolBadgeClass(blog.aiTool)
                  )}
                >
                  {blog.aiTool}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className='font-createRound text-2xl text-zinc-100 group-hover:text-green-400 transition-colors leading-snug'>
              {blog.title}
            </h2>

            {/* Description */}
            <p className='text-zinc-400 font-workSans text-sm line-clamp-3 leading-relaxed'>
              {blog.description}
            </p>

            {/* Action suggestion */}
            {blog.actionSuggestion && (
              <p className='text-sm font-workSans text-zinc-400 border-l-2 border-zinc-700 pl-3 italic'>
                {blog.actionSuggestion}
              </p>
            )}

            {/* Signal indicators */}
            <div className='flex flex-wrap items-center gap-3 mt-auto pt-2'>
              {blog.canLearn && (
                <span className='font-mono text-xs text-green-400'>● LEARN</span>
              )}
              {blog.canTest && (
                <span className='font-mono text-xs text-green-400'>✓ TEST</span>
              )}
            </div>

            {/* Date + reading time */}
            <div className='font-mono text-xs text-zinc-500 flex items-center gap-2 mt-1'>
              <span>{format(new Date(blog.createdAt), 'MMM dd, yyyy')}</span>
              <span>·</span>
              <span>{readingTime} min read</span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  // Standard card — vertical layout
  return (
    <Link href={`/blogs/${blog.slug}`} className='block group'>
      <article
        className={cn(
          'bg-zinc-900 border border-zinc-800 rounded-md cursor-pointer overflow-hidden flex flex-col',
          'hover:border-zinc-600 hover:bg-zinc-800/80 transition-all duration-200',
          'hover:translate-y-[-2px] hover:shadow-[0_0_0_1px_theme(colors.zinc.700)]'
        )}
      >
        {/* Image */}
        <div className='relative w-full aspect-video overflow-hidden'>
          <Image
            src={blog.image?.url ?? getFallbackImage(blog.aiTool)}
            alt={blog.title}
            fill
            className='object-cover group-hover:scale-[1.02] transition-transform duration-300'
          />
        </div>

        {/* Content */}
        <div className='flex flex-col gap-3 p-4 flex-1'>
          {/* Top meta row */}
          <div className='flex flex-wrap items-center gap-2'>
            {blog.importanceLevel === 'medium' && (
              <span className='font-mono text-xs text-yellow-500'>● MEDIUM</span>
            )}
            {blog.importanceLevel === 'low' && (
              <span className='font-mono text-xs text-zinc-600'>● LOW</span>
            )}
            {blog.aiTool && (
              <span
                className={cn(
                  'font-mono text-xs px-2 py-0.5 rounded border',
                  getAiToolBadgeClass(blog.aiTool)
                )}
              >
                {blog.aiTool}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className='font-createRound text-xl text-zinc-100 group-hover:text-green-400 transition-colors leading-snug'>
            {blog.title}
          </h2>

          {/* Description */}
          <p className='text-zinc-400 font-workSans text-sm line-clamp-2 leading-relaxed flex-1'>
            {blog.description}
          </p>

          {/* Signal indicators */}
          {(blog.canLearn || blog.canTest) && (
            <div className='flex flex-wrap items-center gap-3'>
              {blog.canLearn && (
                <span className='font-mono text-xs text-green-400'>● LEARN</span>
              )}
              {blog.canTest && (
                <span className='font-mono text-xs text-green-400'>✓ TEST</span>
              )}
            </div>
          )}

          {/* Date + reading time */}
          <div className='font-mono text-xs text-zinc-500 flex items-center gap-2 mt-auto pt-1'>
            <span>{format(new Date(blog.createdAt), 'MMM dd, yyyy')}</span>
            <span>·</span>
            <span>{readingTime} min read</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default BlogCard
