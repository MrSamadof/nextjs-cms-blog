'use client'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Loader2, Minus, Search } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ChangeEvent, useEffect, useState } from 'react'
import { IBlog, ICategoryAndTags } from '@/types'
import { getSearchBlogs } from '@/service/blog.service'
import { getTags } from '@/service/tag.service'
import { debounce } from 'lodash'
import SearchCard from '@/components/cards/search'
import { Separator } from '@/components/ui/separator'

const FILTER_CATEGORIES = [
	{ label: 'Yuqori signal', href: '/blogs' },
	{ label: "O'rganish", href: '/blogs' },
	{ label: "Sinab ko'rish", href: '/blogs' },
	{ label: 'GPT', href: '/blogs' },
	{ label: 'Gemini', href: '/blogs' },
	{ label: 'Claude', href: '/blogs' },
	{ label: 'Other', href: '/blogs' },
]

function Globalsearch() {
	const [isLoading, setIsLoading] = useState(false)
	const [blogs, setBlogs] = useState<IBlog[]>([])
	const [tags, setTags] = useState<ICategoryAndTags[]>([])

	useEffect(() => {
		getTags().then(setTags).catch(() => {})
	}, [])

	const handleSearch = async (e: ChangeEvent<HTMLInputElement>) => {
		const text = e.target.value.toLowerCase()
		if (text && text.length > 2) {
			setIsLoading(true)
			const data = await getSearchBlogs(text)
			setBlogs(data)
			setIsLoading(false)
		} else {
			setBlogs([])
			setIsLoading(false)
		}
	}

	const debounceSearch = debounce(handleSearch, 500)

	return (
		<Drawer>
			<DrawerTrigger>
				<div className='cursor-pointer rounded-md transition-colors flex items-center gap-1.5 px-2 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'>
					<Search className='w-4 h-4' />
					<span className='hidden md:flex text-sm font-workSans'>Search</span>
				</div>
			</DrawerTrigger>
			<DrawerContent>
				<VisuallyHidden>
					<DrawerTitle>Search blogs</DrawerTitle>
				</VisuallyHidden>
				<div className='container max-w-6xl mx-auto py-12'>
					<Input
						className='bg-secondary'
						placeholder='Bloglarni qidiring...'
						onChange={debounceSearch}
						disabled={isLoading}
					/>
					{isLoading && <Loader2 className='animate-spin mt-4 mx-auto' />}
					{blogs.length ? (
						<div className='text-2xl font-createRound mt-8'>
							{blogs.length} ta natija topildi.
						</div>
					) : null}
					<div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mt-2'>
						{blogs.map(blog => (
							<SearchCard key={blog.slug} {...blog} />
						))}
					</div>
					{blogs.length ? <Separator className='mt-3' /> : null}

					<div className='flex flex-col space-y-2 mt-4'>
						<div className='flex items-center gap-2'>
							<p className='text-2xl font-workSans'>Kategoriyalar bo&apos;yicha</p>
						</div>
						<div className='flex flex-wrap gap-2'>
							{FILTER_CATEGORIES.map(item => (
								<Link key={item.label} href={item.href}>
									<DrawerClose>
										<Badge variant={'secondary'}>{item.label}</Badge>
									</DrawerClose>
								</Link>
							))}
						</div>
					</div>

					{tags.length > 0 && (
						<div className='flex flex-col space-y-2 mt-4'>
							<div className='flex items-center gap-2'>
								<p className='text-2xl font-workSans'>Teglar bo&apos;yicha</p>
								<Minus />
								<Link href={'/tags'}>
									<DrawerClose className='text-green-500 underline hover:opacity-90 text-sm'>
										Barchasi
									</DrawerClose>
								</Link>
							</div>
							<div className='flex flex-wrap gap-2'>
								{tags.map(item => (
									<Link key={item.slug} href={`/tags/${item.slug}`}>
										<DrawerClose>
											<Badge variant={'secondary'}>{item.name}</Badge>
										</DrawerClose>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	)
}

export default Globalsearch
