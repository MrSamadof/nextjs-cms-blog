// FILE: app/(root)/blogs/page.tsx
export const dynamic = 'force-dynamic'

import { getBlogs } from '@/service/blog.service'
import { Metadata } from 'next'
import BlogFeed from '../(home)/_components/blog-feed'

export const metadata: Metadata = {
	title: 'Barcha postlar — SamoDev'
}

async function BlogsPage() {
	const blogs = await getBlogs()

	return (
		<div className='min-h-screen'>
			<div className='max-w-6xl mx-auto px-4 pt-20 pb-24'>
				{/* Header */}
				<div className='mb-8'>
					<p className='font-mono text-xs text-gray-500 dark:text-zinc-600 uppercase tracking-widest mb-2'>
						/ barcha postlar
					</p>
					<h1 className='font-createRound text-3xl md:text-4xl text-gray-900 dark:text-zinc-100'>
						Signal Feed
					</h1>
					<p className='font-workSans text-sm text-gray-600 dark:text-zinc-500 mt-2'>
						{blogs.length} ta post · AI, avtomatlashtirish va dasturlash bo&apos;yicha
					</p>
				</div>

				{/* Feed */}
				<BlogFeed blogs={blogs} />
			</div>
		</div>
	)
}

export default BlogsPage
