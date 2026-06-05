import { getPosts, createPost } from "@/lib/actions/news"
import { PostCard } from "@/components/news/PostCard"

export const revalidate = 60

export default async function NewsPage() {
  const postList = await getPosts()

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

      {/* Composer */}
      <div className="bg-surface p-6 rounded-lg border border-outline-variant shadow-sm">
        <form
          action={async (fd: FormData) => {
            "use server"
            const body = fd.get("body") as string
            if (body?.trim()) await createPost({ body: body.trim() })
          }}
        >
          <textarea
            name="body"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-[14px] min-h-[100px] resize-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 transition-all"
            placeholder="Partager une actualité ou une information avec le réseau..."
            aria-label="Nouveau post"
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="bg-teal-700 text-white px-6 py-2 rounded font-medium text-[14px] hover:bg-teal-800 transition-all active:scale-95 shadow-sm"
            >
              Publier
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      {postList.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4 block" aria-hidden="true">feed</span>
          <p className="text-[16px]">Aucune actualité pour le moment.</p>
        </div>
      ) : (
        postList.map((post) => (
          <PostCard
            key={post.id}
            post={{
              ...post,
              author: {
                id: post.author.id,
                name: post.author.name ?? "Utilisateur",
                role: post.author.role as string,
              },
            }}
          />
        ))
      )}
    </div>
  )
}
