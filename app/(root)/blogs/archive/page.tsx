export const revalidate = 60

import { getArchiveBlogsWithIds } from '@/service/blog.service'
import { Metadata } from 'next'
import ArchiveActions from './_components/archive-actions'

export const metadata: Metadata = {
	title: 'Archive — SamoDev'
}

async function ArchivePage() {
	const groups = await getArchiveBlogsWithIds()

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

				<ArchiveActions groups={groups} />
			</div>
		</div>
	)
}

export default ArchivePage
