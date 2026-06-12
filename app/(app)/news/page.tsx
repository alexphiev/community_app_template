import { auth } from "@/auth"
import { getPosts } from "@/lib/actions/news"
import { NewsFeed } from "@/components/news/NewsFeed"

export const revalidate = 60

export default async function NewsPage() {
  const [session, postList] = await Promise.all([auth(), getPosts()])

  const postsFeed = postList.map((post) => ({
    ...post,
    author: {
      id: post.author.id,
      name: post.author.name ?? "Utilisateur",
      role: post.author.role as string,
    },
  }))

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="mb-6">
        <h1
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Actualités
        </h1>
        <p className="text-[14px] text-on-surface-variant">
          Le flux d&apos;information du réseau Info Jeunes Pays de la Loire.
        </p>
      </div>

      <NewsFeed
        initialPosts={postsFeed}
        currentUser={{
          id: session!.user.id!,
          name: session!.user.name ?? "Utilisateur",
          role: session!.user.role,
        }}
      />
    </div>
  )
}
