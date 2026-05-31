import { NextRequest, NextResponse } from 'next/server'

const graphqlAPI = process.env.NEXT_PUBLIC_GRAPHCMS_ENDPOINT!
const writeToken = process.env.HYGRAPH_WRITE_TOKEN!

async function deleteById(id: string): Promise<void> {
	const mutation = `
		mutation DeleteBlog($id: ID!) {
			deleteBlog(where: { id: $id }) {
				id
			}
		}
	`
	const res = await fetch(graphqlAPI, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${writeToken}`,
		},
		body: JSON.stringify({ query: mutation, variables: { id } }),
	})

	const json = await res.json()
	if (json.errors) {
		throw new Error(json.errors[0]?.message ?? 'GraphQL error')
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()

		if (body.deleteAll && Array.isArray(body.ids)) {
			await Promise.all(body.ids.map((id: string) => deleteById(id)))
			return NextResponse.json({ success: true, deleted: body.ids.length })
		}

		if (typeof body.id === 'string') {
			await deleteById(body.id)
			return NextResponse.json({ success: true })
		}

		return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
