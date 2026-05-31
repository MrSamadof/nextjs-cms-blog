// FILE: app/(root)/blogs/[slug]/page.tsx
import { getReadingTime } from '@/lib/utils'
import { getDetailedBlog } from '@/service/blog.service'
import { format } from 'date-fns'
import parse from 'html-react-parser'
import { ArrowLeft, ArrowUpRight, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ShareBtns from '../../_components/share-btns'
import ReadingProgress from './_components/reading-progress'

const FALLBACK_IMAGE =
  'https://us-west-2.graphassets.com/cmgfe2kkj071x07n6dup74m4b/cmgpavuhj7r2907n8bedqoubp'

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: metaSlug } = await params
  const blog = await getDetailedBlog(metaSlug)

  return {
    title: blog.title,
    description: blog.description,
    openGraph: {
      images: blog.image?.url ?? FALLBACK_IMAGE,
    },
  }
}

async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const blog = await getDetailedBlog(slug)
  const readingTime = getReadingTime(blog.content?.html ?? '')

  return (
    <div className='min-h-screen bg-zinc-950'>
      <ReadingProgress />

      <div className='max-w-[72ch] mx-auto px-4 pt-20 pb-24'>
        {/* Back link */}
        <Link
          href='/blogs'
          className='inline-flex items-center gap-1.5 font-workSans text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8'
        >
          <ArrowLeft className='w-4 h-4' />
          Postlarga qaytish
        </Link>

        {/* Title */}
        <h1 className='font-createRound text-3xl md:text-4xl text-zinc-50 leading-tight mb-4'>
          {blog.title}
        </h1>

        {/* Meta row */}
        <div className='flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-500 mb-6'>
          {blog.author && <span>by {blog.author.name}</span>}
          {blog.author && <span>·</span>}
          <span>{format(new Date(blog.createdAt), 'MMM dd, yyyy')}</span>
          <span>·</span>
          <span>{readingTime} min read</span>
        </div>

        {/* Badges */}
        <div className='flex flex-wrap items-center gap-2 mb-6'>
          {blog.importanceLevel === 'high' && (
            <span className='font-mono text-xs text-orange-400 bg-orange-950 border border-orange-800 px-2 py-0.5 rounded'>
              <span className='animate-pulse'>▮</span> HIGH SIGNAL
            </span>
          )}
          {blog.importanceLevel === 'medium' && (
            <span className='font-mono text-xs text-yellow-500 bg-yellow-950/40 border border-yellow-800/50 px-2 py-0.5 rounded'>
              ● MEDIUM
            </span>
          )}
          {blog.importanceLevel === 'low' && (
            <span className='font-mono text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded'>
              ● LOW
            </span>
          )}
          {blog.aiTool && (
            <span
              className={`font-mono text-xs px-2 py-0.5 rounded border ${getAiToolBadgeClass(blog.aiTool)}`}
            >
              {blog.aiTool}
            </span>
          )}
          {blog.canLearn && (
            <span className='font-mono text-xs text-green-400'>● LEARN</span>
          )}
          {blog.canTest && (
            <span className='font-mono text-xs text-green-400'>✓ TEST</span>
          )}
        </div>

        {/* Hero image */}
        <div className='relative w-full aspect-video mb-10'>
          <Image
            src={blog.image?.url ?? FALLBACK_IMAGE}
            alt={blog.title}
            fill
            className='object-cover rounded-md'
            priority
          />
        </div>

        {/* Article layout: ShareBtns left sticky + prose */}
        <div className='flex md:gap-10 max-md:flex-col-reverse'>
          {/* Share sidebar */}
          <div className='flex flex-col space-y-3 md:w-10'>
            <div className='sticky top-20'>
              <p className='font-mono text-xs text-zinc-600 uppercase tracking-widest mb-2 hidden md:block'>
                Share
              </p>
              <ShareBtns />
            </div>
          </div>

          {/* Prose content */}
          <div
            className={[
              'flex-1 prose prose-zinc dark:prose-invert max-w-none',
              'prose-headings:font-createRound',
              'prose-code:bg-zinc-800 prose-code:text-green-300 prose-code:rounded prose-code:px-1 prose-code:before:content-none prose-code:after:content-none',
              'prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline',
              'prose-blockquote:border-l-2 prose-blockquote:border-zinc-700 prose-blockquote:text-zinc-400 prose-blockquote:not-italic',
              'prose-p:text-zinc-300 prose-li:text-zinc-300',
              'prose-strong:text-zinc-200',
              'prose-h1:text-zinc-100 prose-h2:text-zinc-100 prose-h3:text-zinc-100 prose-h4:text-zinc-100',
            ].join(' ')}
          >
            {parse(blog.content?.html ?? '')}
          </div>
        </div>

        {/* AI Metadata Panel */}
        {(blog.importanceLevel ||
          blog.aiTool ||
          blog.canLearn !== null ||
          blog.canTest !== null ||
          blog.actionSuggestion ||
          blog.sourceUrl) && (
          <div
            className='bg-zinc-900 border border-zinc-700 rounded-md p-6 mt-12 opacity-0 animate-[fadeIn_0.5s_ease_forwards]'
            style={{ animationDelay: '200ms' }}
          >
            <p className='font-mono text-xs text-zinc-500 tracking-widest uppercase mb-4'>
              AI Tahlili
            </p>
            <div className='flex flex-col gap-3'>
              {blog.importanceLevel && (
                <MetaRow label='Signal darajasi' value={blog.importanceLevel.toUpperCase()} />
              )}
              {blog.aiTool && (
                <MetaRow label='AI vositasi' value={blog.aiTool} />
              )}
              {blog.canLearn !== null && blog.canLearn !== undefined && (
                <MetaRow
                  label="O'rganish mumkin"
                  value={blog.canLearn ? 'Ha' : "Yo'q"}
                />
              )}
              {blog.canTest !== null && blog.canTest !== undefined && (
                <MetaRow
                  label="Sinab ko'rish"
                  value={blog.canTest ? 'Ha' : "Yo'q"}
                />
              )}
              {blog.actionSuggestion && (
                <MetaRow label='Tavsiya' value={blog.actionSuggestion} />
              )}
              {blog.sourceUrl && (
                <div className='flex items-start gap-4'>
                  <span className='font-mono text-xs text-zinc-600 w-36 flex-shrink-0 pt-0.5'>
                    Manba
                  </span>
                  <a
                    href={blog.sourceUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='font-workSans text-sm text-green-400 hover:underline flex items-center gap-1'
                  >
                    Asl maqola
                    <ExternalLink className='w-3 h-3' />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Author card */}
        {blog.author && (
          <div className='flex mt-12 gap-6 items-center max-md:flex-col border-t border-zinc-800 pt-10'>
            <Image
              src={blog.author.image?.url ?? FALLBACK_IMAGE}
              alt={blog.author.name}
              width={80}
              height={80}
              className='rounded-md object-cover flex-shrink-0 max-md:self-start'
            />
            <div className='flex-1 flex flex-col gap-2'>
              <h2 className='font-createRound text-xl text-zinc-100'>
                {blog.author.name}
              </h2>
              <p className='font-workSans text-sm text-zinc-500 line-clamp-2'>
                {blog.author.bio}
              </p>
              <Link
                href={`/author/${blog.author.id}`}
                className='inline-flex items-center gap-1.5 font-workSans text-sm text-green-400 hover:underline transition-colors w-fit mt-1'
              >
                <span>Barcha maqolalar</span>
                <ArrowUpRight className='w-3.5 h-3.5' />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start gap-4'>
      <span className='font-mono text-xs text-zinc-600 w-36 flex-shrink-0 pt-0.5'>
        {label}
      </span>
      <span className='font-workSans text-sm text-zinc-300'>{value}</span>
    </div>
  )
}

export default SlugPage
