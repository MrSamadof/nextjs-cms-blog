import { NextRequest, NextResponse } from 'next/server'

const graphqlAPI = process.env.NEXT_PUBLIC_GRAPHCMS_ENDPOINT!
const writeToken = process.env.HYGRAPH_WRITE_TOKEN!

async function hygraphMutation(query: string, variables: Record<string, unknown>) {
	const res = await fetch(graphqlAPI, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${writeToken}`,
		},
		body: JSON.stringify({ query, variables }),
	})

	const json = await res.json()

	if (!res.ok) {
		throw new Error(`HTTP ${res.status}: ${res.statusText}`)
	}
	if (json.errors) {
		const msg = json.errors.map((e: { message: string }) => e.message).join('; ')
		throw new Error(msg)
	}

	return json.data
}

async function deleteById(id: string): Promise<void> {
	// Step 1: unpublish (ignore error if already draft)
	try {
		await hygraphMutation(
			`mutation UnpublishBlog($id: ID!) {
				unpublishBlog(where: { id: $id }, from: [PUBLISHED]) { id }
			}`,
			{ id }
		)
	} catch {
		// already in DRAFT stage — continue to delete
	}

	// Step 2: delete
	await hygraphMutation(
		`mutation DeleteBlog($id: ID!) {
			deleteBlog(where: { id: $id }) { id }
		}`,
		{ id }
	)
}

export async function POST(req: NextRequest) {
	if (!writeToken) {
		return NextResponse.json(
			{ error: 'HYGRAPH_WRITE_TOKEN muhit o\'zgaruvchisi topilmadi' },
			{ status: 500 }
		)
	}

	try {
		const body = await req.json()

		if (body.deleteAll && Array.isArray(body.ids) && body.ids.length > 0) {
			// Delete one by one to get partial success info
			const results = await Promise.allSettled(
				body.ids.map((id: string) => deleteById(id))
			)
			const failed = results.filter(r => r.status === 'rejected').length
			const succeeded = results.length - failed

			if (failed > 0) {
				const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult
				return NextResponse.json(
					{ error: `${succeeded} ta o'chirildi, ${failed} ta xato: ${firstError.reason?.message}` },
					{ status: 207 }
				)
			}

			return NextResponse.json({ success: true, deleted: succeeded })
		}

		if (typeof body.id === 'string' && body.id.length > 0) {
			await deleteById(body.id)
			return NextResponse.json({ success: true })
		}

		return NextResponse.json({ error: 'id maydoni talab qilinadi' }, { status: 400 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Noma\'lum xato'
		console.error('[delete-post]', message)
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
