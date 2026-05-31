'use client'

import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
	const router = useRouter()
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [deletingAll, setDeletingAll] = useState(false)

	const allIds = groups.flatMap(g => g.blogs.map(b => b.id))

	async function handleDelete(id: string) {
		const confirmed = window.confirm("Bu postni o'chirmoqchimisiz?")
		if (!confirmed) return

		setDeletingId(id)
		try {
			const res = await fetch('/api/delete-post', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id }),
			})
			if (!res.ok) throw new Error('Request failed')
			router.refresh()
		} catch {
			alert("Xatolik yuz berdi")
		} finally {
			setDeletingId(null)
		}
	}

	async function handleDeleteAll() {
		const confirmed = window.confirm(
			`Arxivdagi barcha ${allIds.length} ta postni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.`
		)
		if (!confirmed) return

		setDeletingAll(true)
		try {
			const res = await fetch('/api/delete-post', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deleteAll: true, ids: allIds }),
			})
			if (!res.ok) throw new Error('Request failed')
			router.refresh()
		} catch {
			alert("Xatolik yuz berdi")
		} finally {
			setDeletingAll(false)
		}
	}

	if (groups.length === 0) {
		return (
			<p className='font-mono text-sm text-zinc-500'>Arxivda hozircha post yo&apos;q.</p>
		)
	}

	return (
		<div>
			{/* Delete all button */}
			<div className='flex justify-end mb-8'>
				<button
					onClick={handleDeleteAll}
					disabled={deletingAll}
					className='text-xs font-mono text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
				>
					{deletingAll ? "O'chirilmoqda..." : "Hammasini o'chirish"}
				</button>
			</div>

			{groups.map(group => (
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
									className='font-workSans text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline transition-colors flex-1'
								>
									{item.title}
								</Link>
								<button
									onClick={() => handleDelete(item.id)}
									disabled={deletingId === item.id || deletingAll}
									aria-label={`O'chirish: ${item.title}`}
									className='opacity-0 group-hover:opacity-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
								>
									<Trash2 className='w-3.5 h-3.5 text-gray-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-400 transition-colors' />
								</button>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	)
}
