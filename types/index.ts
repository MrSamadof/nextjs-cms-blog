export interface ChildProps {
	children: React.ReactNode
}


export interface IArchivedBlog{
	year: string
	blogs: IBlog[]
}

export interface IBlog {
	title: string
	description: string
	author: IAuthor | null
	category: ICategoryAndTags | null
	tag: ICategoryAndTags | null
	image: { url: string } | null
	createdAt: string
	content: { html: string } | null
	slug: string
	archive: boolean | null
	importanceLevel: 'low' | 'medium' | 'high' | null
	canLearn: boolean | null
	canTest: boolean | null
	actionSuggestion: string | null
	aiTool: string | null
	sourceUrl: string | null
}

export interface IAuthor{
	name: string
	image: {url: string}
	bio:string
	blogs: IBlog[]
	id: string

}

export interface ICategoryAndTags{
	name: string
	slug: string
	blogs: IBlog[]
}