import { getReadingTime } from '@/lib/utils'
import { getDetailedBlog } from '@/service/blog.service'
import { format } from 'date-fns'
import parse from 'html-react-parser'
import {
	ArrowUpRight,
	CalendarDays,
	Clock,
	Minus,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ShareBtns from '../../_components/share-btns'

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
