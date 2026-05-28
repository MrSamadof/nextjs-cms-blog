import { getReadingTime } from '@/lib/utils'
import { getDetailedBlog } from '@/service/blog.service'
import { format } from 'date-fns'
import parse from 'html-react-parser'
import {
	ArrowUpRight,
	CalendarDays,
	Clock,
	ExternalLink,
	Minus,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ShareBtns from '../../_components/share-btns'

const IMPORTANCE_CONFIG = {
	high:   { label: '🔴 HIGH',   className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
	medium: { label: '🟡 MEDIUM', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
	low:    { label: '🟢 LOW',    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
} as const

const FALLBACK_IMAGE = 'https://us-west-2.graphassets.com/cmgfe2kkj071x07n6dup74m4b/cmgpavuhj7r2907n8bedqoubp'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug: metaSlug } = await params
	const blog = await getDetailedBlog(metaSlug)

	return {
		title: blog.title,
		description: blog.description,
		openGraph: {
			images: blog.image?.url ?? FALLBACK_IMAGE,
		}
	}
}

async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {

	const { slug } = await params
	const blog = await getDetailedBlog(slug)

	return (
		<div className='pt-[15vh] max-w-5xl mx-auto px-4'>
			<h1 className='lg:text-6xl md:text-5xl text-4xl font-creteRound'>
				{blog.title}
			</h1>

			<div className='flex items-center flex-wrap max-md:justify-center gap-4 mt-4'>
				{blog.author && (
					<div className='flex items-center gap-2'>
						<Image
							src={blog.author.image?.url ?? FALLBACK_IMAGE}
							alt='author'
							width={30}
							height={30}
							className='object-cover rounded-sm'
						/>
						<p>by {blog.author.name}</p>
					</div>
				)}
				<Minus />
				<div className='flex items-center gap-2'>
					<Clock className='w-5 h-5' />
					<p>{getReadingTime(blog.content?.html ?? '')} min read</p>
				</div>
				<Minus />
				<div className='flex items-center gap-2'>
					<CalendarDays className='w-5 h-5' />
					<p>{format(new Date(blog.createdAt), 'MMM dd. yyyy')}</p>
				</div>
			</div>

			<Image
				src={blog.image?.url ?? FALLBACK_IMAGE}
				alt={blog.title}
				width={1120}
				height={595}
				className='mt-4 rounded-md'
			/>

			{/* AI metadata strip */}
			{(blog.importanceLevel || blog.aiTool || blog.canLearn || blog.canTest || blog.actionSuggestion || blog.sourceUrl) && (
				<div className='mt-6 flex flex-col gap-4'>
					{/* Badges row */}
					<div className='flex flex-wrap gap-2'>
						{blog.importanceLevel && (() => {
							const cfg = IMPORTANCE_CONFIG[blog.importanceLevel!]
							return (
								<span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
									{cfg.label}
								</span>
							)
						})()}
						{blog.aiTool && (
							<span className='text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground'>
								{blog.aiTool}
							</span>
						)}
						{blog.canLearn && (
							<span className='text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>
								O&apos;rganish mumkin
							</span>
						)}
						{blog.canTest && (
							<span className='text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
								Sinab ko&apos;rish
							</span>
						)}
					</div>

					{/* Action suggestion info box */}
					{blog.actionSuggestion && (
						<div className='rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 italic'>
							{blog.actionSuggestion}
						</div>
					)}

					{/* Source link */}
					{blog.sourceUrl && (
						<a
							href={blog.sourceUrl}
							target='_blank'
							rel='noopener noreferrer'
							className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-500 transition-colors w-fit'
						>
							Asl maqola
							<ExternalLink className='w-3.5 h-3.5' />
						</a>
					)}
				</div>
			)}

			<div className='flex md:gap-12 max-md:flex-col-reverse mt-12 relative'>
				<div className='flex flex-col space-y-3'>
					<div className='sticky top-36'>
						<p className='text-lg uppercase text-muted-foreground'>Share</p>
						<ShareBtns />
					</div>
				</div>
				<div className='flex-1 prose dark:prose-invert'>
					{parse(blog.content?.html ?? '')}
				</div>
			</div>

			{blog.author && (
				<div className='flex mt-6 gap-6 items-center max-md:flex-col'>
					<Image
						src={blog.author.image?.url ?? FALLBACK_IMAGE}
						alt='author'
						width={155}
						height={155}
						className='rounded-md max-md:self-start'
					/>
					<div className='flex-1 flex flex-col space-y-4'>
						<h2 className='text-3xl font-creteRound'>{blog.author.name}</h2>
						<p className='line-clamp-2 text-muted-foreground'>
							{blog.author.bio}
						</p>
						<Link
							href={`/author/${blog.author.id}`}
							className='flex items-center gap-2 hover:text-blue-500 underline transition-colors'
						>
							<span>See all posts by this author</span>
							<ArrowUpRight />
						</Link>
					</div>
				</div>
			)}
		</div>
	)
}

export default SlugPage
