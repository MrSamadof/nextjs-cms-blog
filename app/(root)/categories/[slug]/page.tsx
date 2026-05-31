export const revalidate = 60

import BlogCard from '@/components/cards/blog'
import { getBlogsByCategory } from '@/service/category.service'
import { Dot, Home } from 'lucide-react'
import Link from 'next/link'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug: metaSlug } = await params
	const blog = await getBlogsByCategory(metaSlug)

	return {
		title: blog.name,
	}
};

interface PageProps {
	params: Promise<{ slug: string }>
}

async function Page({ params }: PageProps) {
	const { slug } = await params
	const category = await getBlogsByCategory(slug)

	return (
		<div className='max-w-6xl mx-auto'>
			<div className='relative min-h-[40vh] flex items-center justify-end flex-col'>
				<h2 className='text-center text-4xl section-title font-creteRound mt-2'>
					<span>{category.name}</span>
				</h2>

				<div className='flex gap-1 items-center mt-4'>
					<Home className='w-4 h-4' />
					<Link 
						href={'/'}
						className='opacity-90 hover:underline hover:opacity-100'
					>
						Home
					</Link>
					<Dot />
					<p className='text-muted-foreground'>Category</p>
				</div>
			</div>


					<div className=' grid grid-cols-2 max-md:grid-cols-1 gap-x-1 gap-y-24  mt-24'>
				{category.blogs.map(blog =>(
					<BlogCard key={blog.title} {...blog} isVertical/>
				))}
			</div>
		</div>
	)
}

export default Page