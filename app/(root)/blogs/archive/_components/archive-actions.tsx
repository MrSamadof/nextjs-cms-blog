'use client'

import { format } from 'date-fns'
import Link from 'next/link'

type ArchiveBlogEntry = {
	id: string
	title: string
	slug: string
	createdAt: string
}

type ArchiveGroup = {
	year: string
	blogs: ArchiveBlogEntry[]
}

interface ArchiveActionsProps {
	groups: ArchiveGroup[]
}

export default function ArchiveActions({ groups }: ArchiveActionsProps) {
	if (groups.length === 0) {
		return (
			<p className='font-mono text-sm text-zinc-500'>Arxivda hozircha post yo&apos;q.</p>
		)
	}

	return (
		<div>
			{groups.map(group => (
				<div key={group.year} className='mb-12'>
					<div className='flex items-center gap-4 mb-6'>
						<span className='font-createRound text-4xl text-zinc-900 dark:text-zinc-100'>
							{group.year}
						</span>
						<div className='flex-1 h-px bg-zinc-200 dark:bg-zinc-800' />
					</div>

					<div className='flex flex-col gap-2 pl-2'>
						{group.blogs.map(item => (
							<div key={item.slug} className='flex items-baseline gap-4'>
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
	)
}
