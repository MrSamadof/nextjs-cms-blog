'use client'

import { IBlog } from '@/types'
import { CalendarDays, Clock, Dot, ExternalLink, Layers2, Minus, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '../ui/badge'
import { cn, getReadingTime } from '@/lib/utils'
import { format } from 'date-fns'

const FALLBACK_IMAGE = 'https://us-west-2.graphassets.com/cmgfe2kkj071x07n6dup74m4b/cmgpavuhj7r2907n8bedqoubp'

const IMPORTANCE_CONFIG = {
	high:   { label: '🔴 HIGH',   className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
	medium: { label: '🟡 MEDIUM', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
	low:    { label: '🟢 LOW',    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

interface Props extends IBlog {
	isVertical?: boolean
}

function BlogCard(blog: Props) {

	const importance = blog.importanceLevel ? IMPORTANCE_CONFIG[blog.importanceLevel] : null

	return (
		<div
			className={cn(
				'grid gap-4 group ',
				blog.isVertical ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
			)}
		>
			<Link href={`/blogs/${blog.slug}`}>
				<div className='relative bg-secondary rounded-md'>
					<Image
						width={650}
						height={335}
						src={blog.image?.url ?? FALLBACK_IMAGE}
						alt={blog.title}
						className=' px-2 md:px-7 rounded-md group-hover:-translate-y-7 -translate-y-6 transition-all object-cover grayscale group-hover:grayscale-0 max-md:-translate-y-2 max-md:group-hover:-translate-y-3'
					/>
				</div>
			</Link>

			<div className='flex flex-col space-y-4'>
				{/* Time Info */}
				<Link href={`/blogs/${blog.slug}`} className='flex flex-col space-y-4'>
					<div className='flex items-center gap-4'>
						<div className='flex items-center gap-2'>
							<CalendarDays className='w-5 h-5' />
							<p>{format(new Date(blog.createdAt), 'MMM dd. yyyy')}</p>
						</div>
						<Minus />
						<div className='flex items-center gap-2'>
							<Clock className='w-5 h-5' />
							<p>{getReadingTime(blog.content?.html ?? '')} min read</p>
						</div>
					</div>

					{/* Title */}
					<h2 className='text-3xl max-md:text-2xl font-createRound group-hover:text-blue-500 transition-colors'>
						{blog.title}
					</h2>

					{/* Description */}
					<p className='text-muted-foreground line-clamp-3'>
						{blog.description}
					</p>
				</Link>

				{/* Action suggestion */}
				{blog.actionSuggestion && (
					<p className='text-sm italic text-muted-foreground border-l-2 border-muted pl-3'>
						{blog.actionSuggestion}
					</p>
				)}

				{/* Meta badges */}
				<div className='flex flex-wrap items-center gap-2'>
					{importance && (
						<span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', importance.className)}>
							{importance.label}
						</span>
					)}
					{blog.aiTool && (
						<span className='text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground'>
							{blog.aiTool}
						</span>
					)}
					{blog.canLearn && (
						<span className='text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>
							O&apos;rganish mumkin
						</span>
					)}
					{blog.canTest && (
						<span className='text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
							Sinab ko&apos;rish
						</span>
					)}
				</div>

				{/* Author + tag/category */}
				<div className='flex items-center gap-4'>
					{blog.author && (
						<div className='flex items-center gap-2'>
							<Image
								src={blog.author.image?.url ?? FALLBACK_IMAGE}
								alt='Author'
								width={30}
								height={30}
								className='mt-4 rounded-md'
							/>
							<p>by {blog.author.name}</p>
						</div>
					)}

					{(blog.tag || blog.category) && (
						<>
							{blog.author && <Dot />}
							<div className='flex items-center gap-2'>
								{blog.tag && (
									<Link href={`/tags/${blog.tag.slug}`}>
										<Badge variant={'secondary'} role='button'>
											<Tag className='w-3 h-3 me-2'/>
											{blog.tag.name}
										</Badge>
									</Link>
								)}
								{blog.category && (
									<Link href={`/categories/${blog.category.slug}`}>
										<Badge variant={'outline'} role='button'>
											<Layers2 className='w-3 h-3 me-2'/>
											{blog.category.name}
										</Badge>
									</Link>
								)}
							</div>
						</>
					)}
				</div>

				{/* Source link */}
				{blog.sourceUrl && (
					<a
						href={blog.sourceUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='flex items-center gap-1 text-sm text-muted-foreground hover:text-blue-500 transition-colors w-fit'
					>
						Asl maqola
						<ExternalLink className='w-3 h-3' />
					</a>
				)}
			</div>
		</div>
	)
}

export default BlogCard
