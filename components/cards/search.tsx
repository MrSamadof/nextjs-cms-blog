import { IBlog } from '@/types'
import Link from 'next/link'
import React from 'react'
import { DrawerClose } from '../ui/drawer'
import Image from 'next/image'
import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'

function SearchCard(blog: IBlog) {
	return <Link href={`/blogs/${blog.slug}`}>
		<DrawerClose className='flex flex-col space-y-2 text-start'>
			<Image
			width={200}
			height={200}
			src={blog.image?.url ?? 'https://us-west-2.graphassets.com/cmgfe2kkj071x07n6dup74m4b/cmgpavuhj7r2907n8bedqoubp'}
			alt={blog.title}
			className='w-full h-auto aspect-video object-cover rounded-md shadow-xl dark:shadow-white/10'
			/>
			<div className='flex items-center gap-2'>
				<CalendarDays className='w-4 h-4'/>
				<p className='text-sm'>
					{format(new Date(blog.createdAt), 'MMM dd, yy')}
				</p>
			</div>
			<h1 className='font-createRound'>{blog.title}</h1>
		</DrawerClose>
	</Link>
}

export default SearchCard