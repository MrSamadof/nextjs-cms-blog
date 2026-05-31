import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

export async function POST(req: NextRequest) {
	const secret = req.nextUrl.searchParams.get('secret')

	if (REVALIDATE_SECRET && secret !== REVALIDATE_SECRET) {
		return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
	}

	try {
		// Revalidate all blog-related pages
		revalidatePath('/', 'page')
		revalidatePath('/blogs', 'page')
		revalidatePath('/blogs/[slug]', 'page')
		revalidatePath('/blogs/archive', 'page')
		revalidatePath('/categories', 'page')
		revalidatePath('/categories/[slug]', 'page')
		revalidatePath('/tags', 'page')
		revalidatePath('/tags/[slug]', 'page')
		revalidatePath('/author/[id]', 'page')

		console.log('[revalidate] Cache cleared at', new Date().toISOString())
		return NextResponse.json({ revalidated: true, timestamp: Date.now() })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

// Also allow GET for easy browser/curl testing
export async function GET(req: NextRequest) {
	return POST(req)
}
