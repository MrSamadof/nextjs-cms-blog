export const dynamic = 'force-dynamic'

import { getArchiveBlogs } from '@/service/blog.service'
import { format } from 'date-fns'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'Archive — SamoDev'
}

async function ArchivePage() {
	const blogs = await getArchiveBlogs()

	return (
		<div className='min-h-screen'>
			<div className='max-w-6xl mx-auto px-4 pt-20 pb-24'>
				{/* Header */}
				<div className='mb-12'>
					<p className='font-mono text-xs text-zinc-600 dark:text-zinc-600 uppercase tracking-widest mb-2'>
						/ arxiv
					</p>
					<h1 className='font-createRound text-3xl md:text-4xl text-zinc-900 dark:text-zinc-100'>
						Arxiv
					</h1>
					<p className='font-workSans text-sm text-zinc-500 dark:text-zinc-500 mt-2'>
						Arxivlangan barcha postlar
					</p>
				</div>

				{blogs.length === 0 && (
					<p className='font-mono text-sm text-zinc-500'>Arxivda hozircha post yo&apos;q.</p>
				)}

				{blogs.map(group => (
					<div key={group.year} className='mb-12'>
						{/* Year label */}
						<div className='flex items-center gap-4 mb-6'>
							<span className='font-createRound text-4xl text-zinc-900 dark:text-zinc-100'>
								{group.year}
							</span>
							<div className='flex-1 h-px bg-zinc-200 dark:bg-zinc-800' />
						</div>

						{/* Posts list */}
						<div className='flex flex-col gap-2 pl-2'>
							{group.blogs.map(item => (
								<div
									key={item.slug}
									className='flex items-baseline gap-4 group'
								>
									<span className='font-mono text-xs text-zinc-500 dark:text-zinc-600 w-16 flex-shrink-0'>
										{format(new Date(item.createdAt), 'dd MMM')}
									</span>
									<span className='text-zinc-300 dark:text-zinc-700 select-none'>·</span>
									<Link
										href={`/blogs/${item.slug}`}
										className='font-workSans text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline transition-colors'
									>
										{item.title}
									</Link>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default ArchivePage
