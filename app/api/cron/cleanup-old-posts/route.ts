// Runs daily at 00:00 UTC — deletes posts older than 30 days
import { NextRequest, NextResponse } from 'next/server'

const graphqlAPI = process.env.NEXT_PUBLIC_GRAPHCMS_ENDPOINT!
const writeToken = process.env.HYGRAPH_WRITE_TOKEN!
const cronSecret = process.env.CRON_SECRET

async function hygraphRequest(query: string, variables?: Record<string, unknown>) {
	const res = await fetch(graphqlAPI, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${writeToken}`,
		},
		body: JSON.stringify({ query, variables }),
	})
	const json = await res.json()
	if (json.errors) {
		throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '))
	}
	return json.data
}

async function getOldPostIds(cutoffDate: string): Promise<string[]> {
	const data = await hygraphRequest(`
		query GetOldPosts($cutoff: DateTime!) {
			blogs(first: 1000, where: { createdAt_lte: $cutoff }) {
				id
				title
				createdAt
			}
		}
	`, { cutoff: cutoffDate })

	return (data?.blogs ?? []).map((b: { id: string }) => b.id)
}

async function deleteById(id: string) {
	// Unpublish first (ignore if already draft)
	try {
		await hygraphRequest(
			`mutation { unpublishBlog(where: { id: "${id}" }, from: [PUBLISHED]) { id } }`
		)
	} catch { /* already draft */ }

	// Delete
	await hygraphRequest(
		`mutation { deleteBlog(where: { id: "${id}" }) { id } }`
	)
}

export async function GET(req: NextRequest) {
	// Verify cron secret
	const authHeader = req.headers.get('authorization')
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	if (!writeToken) {
		return NextResponse.json({ error: 'HYGRAPH_WRITE_TOKEN not set' }, { status: 500 })
	}

	// Cutoff: 30 days ago
	const cutoff = new Date()
	cutoff.setDate(cutoff.getDate() - 30)
	const cutoffISO = cutoff.toISOString()

	console.log(`[cleanup-cron] Running — cutoff: ${cutoffISO}`)

	let ids: string[]
	try {
		ids = await getOldPostIds(cutoffISO)
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Unknown error'
		console.error('[cleanup-cron] Failed to fetch old posts:', msg)
		return NextResponse.json({ error: msg }, { status: 500 })
	}

	if (ids.length === 0) {
		console.log('[cleanup-cron] No posts older than 30 days found.')
		return NextResponse.json({ deleted: 0, errors: [] })
	}

	console.log(`[cleanup-cron] Found ${ids.length} posts to delete`)

	const errors: string[] = []
	let deleted = 0

	for (const id of ids) {
		try {
			await deleteById(id)
			deleted++
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			errors.push(`${id}: ${msg}`)
			console.error(`[cleanup-cron] Failed to delete ${id}:`, msg)
		}
	}

	console.log(`[cleanup-cron] Done — deleted: ${deleted}, errors: ${errors.length}`)
	return NextResponse.json({ deleted, errors, cutoff: cutoffISO })
}
