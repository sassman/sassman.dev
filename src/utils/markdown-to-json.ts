import * as fs from 'fs'
import * as path from 'path'
import { Marked } from '@ts-stack/markdown'
import { loadFront } from 'yaml-front-matter'
const excerptHtml = require('excerpt-html')

const contentDir = path.join(process.cwd(), 'content', 'posts')
const targetFile = path.join(
  process.cwd(),
  'src',
  'routes',
  'blog',
  '_posts.json'
)

type PostYamlHeader = {
  title: string
  published: boolean
  date: Date
  description?: string
  tags?: string[]
  series?: string
  cover_image?: string
}

export type Post = PostYamlHeader & {
  slug: string
  excerptHtml: string
  contentHtml: string
}

Marked.setOptions({
  pedantic: false,
  sanitize: false,
})

export const markdownToJson = async () => {
  const posts: Post[] = await getSortedPostsData()

  posts.map((p) => console.log(`✅ ${p.slug}`))
  fs.writeFileSync(targetFile, JSON.stringify({ posts }))
}

async function getSortedPostsData(): Promise<Post[]> {
  // Get file names under /posts
  const fileNames = fs.readdirSync(contentDir)
  const allPostsData = await Promise.all(
    fileNames
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ absFilePath: path.join(contentDir, f), file: f }))
      .map(getPostData)
  )

  return allPostsData
    .filter((p) => p?.published)
    .map((p) => p as Post)
    .sort((a, b) => {
      if (a.date < b.date) {
        return 1
      } else {
        return -1
      }
    })
}

async function getPostData({
  absFilePath,
  file,
}: {
  absFilePath: string
  file: string
}): Promise<Post | undefined> {
  const fileContents = fs.readFileSync(absFilePath, 'utf8')
  try {
    const yamlHeader = loadFront(fileContents)
    const contentHtml = Marked.parse(yamlHeader.__content)
    const excerpt = excerptHtml(contentHtml, { pruneLength: 250 })
    const date = yamlHeader.date ?? Date.parse(file.substring(0, 10))

    return {
      ...((yamlHeader as any) as PostYamlHeader),
      slug: file,
      contentHtml,
      excerptHtml: excerpt,
      tags: yamlHeader.tags
        ?.split(',')
        .map((t: string) => (t as string).trim()),
      date,
    }
  } catch (e) {
    console.log(e)
    return undefined
  }
}

try {
  markdownToJson()
} catch (error) {
  console.error(error)
}
