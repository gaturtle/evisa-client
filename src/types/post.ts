export type PostStatus = "draft" | "published"

export interface Post {
  id: string
  title: string
  slug: string
  content?: string
  thumbnailUrl?: string | null
  status: PostStatus
  categoryId: string
  categoryName?: string
  category?: { id: string; name: string; slug: string }
  createdAt: string
  updatedAt: string
}

export interface CreatePostRequest {
  title: string
  slug: string
  content: string
  thumbnailUrl?: string
  categoryId: string
  status: PostStatus
}

export interface UpdatePostRequest {
  title: string
  slug: string
  content: string
  thumbnailUrl?: string
  categoryId: string
  status: PostStatus
}

export interface UpdatePostStatusRequest {
  status: PostStatus
}
