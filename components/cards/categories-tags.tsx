import { ICategoryAndTags } from '@/types'
import { Layers2, Tags } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

interface Props extends ICategoryAndTags {
	type: 'categories' | 'tags'
}

function CategoriesTagsCard(item: Props ) {
	return (
		<Link 
			className='bg-secondary p-4 md:p-8 rounded-md shadow-xl flex flex-col items-center justify-center hover:bg-secondary/80 transition-colors dark:shadow-white/10 space-y-2' 
			href={`/${item.type}/${item.slug}`}
		>		 


			{item.type === 'tags' ? <Tags/> : <Layers2/>}
			<h1 className='text-xl font-createRound'>{item.name}</h1>
			<p>{item.blogs.length} blogs</p>

		</Link>
	)
}

export default CategoriesTagsCard