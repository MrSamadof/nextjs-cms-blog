'use client'
import {
	Drawer,
	DrawerContent,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Loader2, Minus, Search } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { IBlog, ICategoryAndTags } from '@/types'
import { getSearchBlogs } from '@/service/blog.service'
import { getTags } from '@/service/tag.service'
import { useRouter } from 'next/navigation'
import { debounce } from 'lodash'
import SearchCard from '@/components/cards/search'
import { Separator } from '@/components/ui/separator'

// Filter keys must match BlogFeed's filter system
const FILTER_CATEGORIES = [
	{ label: 'Yuqori signal', filterKey: 'high' },
	{ label: "O'rganish",     filterKey: 'learn' },
	{ label: "Sinab ko'rish", filterKey: 'test' },
	{ label: 'GPT',           filterKey: 'GPT' },
	{ label: 'Gemini',        filterKey: 'Gemini' },
	{ label: 'Claude',        filterKey: 'Claude' },
	{ label: 'Other',         filterKey: 'Other' },
]

function Globalsearch() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [blogs, setBlogs] = useState<IBlog[]>([])
	const [tags, setTags] = useState<ICategoryAndTags[]>([])

	useEffect(() => {
		getTags()
			.then(all => setTags(all.filter(t => t.blogs && t.blogs.length > 0)))
			.catch(() => {})
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

	function navigateToFilter(filterKey: string) {
		setOpen(false)
		router.push(`/blogs?filter=${encodeURIComponent(filterKey)}`)
	}

	function navigateToTag(slug: string) {
		setOpen(false)
		router.push(`/tags/${slug}`)
	}

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>
				<button className='cursor-pointer rounded-md transition-colors flex items-center gap-1.5 px-2 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'>
					<Search className='w-4 h-4' />
					<span className='hidden md:flex text-sm font-workSans'>Search</span>
				</button>
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
							<div key={blog.slug} onClick={() => setOpen(false)}>
								<SearchCard {...blog} />
							</div>
						))}
					</div>
					{blogs.length ? <Separator className='mt-3' /> : null}

					{/* Filter categories */}
					<div className='flex flex-col space-y-2 mt-4'>
						<p className='text-2xl font-workSans'>Kategoriyalar bo&apos;yicha</p>
						<div className='flex flex-wrap gap-2'>
							{FILTER_CATEGORIES.map(item => (
								<button
									key={item.filterKey}
									onClick={() => navigateToFilter(item.filterKey)}
								>
									<Badge variant='secondary'>{item.label}</Badge>
								</button>
							))}
						</div>
					</div>

					{/* Real tags from Hygraph */}
					{tags.length > 0 && (
						<div className='flex flex-col space-y-2 mt-4'>
							<div className='flex items-center gap-2'>
								<p className='text-2xl font-workSans'>Teglar bo&apos;yicha</p>
								<Minus />
								<button
									onClick={() => { setOpen(false); router.push('/tags') }}
									className='text-green-500 underline hover:opacity-90 text-sm'
								>
									Barchasi
								</button>
							</div>
							<div className='flex flex-wrap gap-2'>
								{tags.map(item => (
									<button
										key={item.slug}
										onClick={() => navigateToTag(item.slug)}
									>
										<Badge variant='secondary'>{item.name}</Badge>
									</button>
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
