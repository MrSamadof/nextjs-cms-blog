import AuthorCard from '@/components/cards/author'
import { getAuthors } from '@/service/author.service'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'About — SamoDev'
}

async function AboutPage() {
	const authors = await getAuthors()

	return (
		<div className='min-h-screen'>
			<div className='max-w-6xl mx-auto px-4 pt-20 pb-24'>
				{/* Header */}
				<div className='mb-12'>
					<p className='font-mono text-xs text-zinc-600 dark:text-zinc-600 uppercase tracking-widest mb-2'>
						/ haqida
					</p>
					<h1 className='font-createRound text-3xl md:text-4xl text-zinc-900 dark:text-zinc-100'>
						SamoDev
					</h1>
					<p className='font-workSans text-sm text-zinc-500 dark:text-zinc-500 mt-2 max-w-xl'>
						AI muhandisligi, avtomatlashtirish va dasturlash bo&apos;yicha tanlab olingan signal. Shovqinsiz, faqat muhim yangilikar.
					</p>
				</div>

				{/* Authors */}
				<div className='mb-4'>
					<p className='font-mono text-xs text-zinc-500 dark:text-zinc-600 uppercase tracking-widest mb-6'>
						/ mualliflar
					</p>
					<div className='flex flex-wrap gap-6 max-md:flex-col'>
						{authors.map(c => (
							<AuthorCard key={c.name} {...c} />
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export default AboutPage
