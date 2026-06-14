import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type {
  Post,
  PostStatus,
  CreatePostRequest,
  UpdatePostRequest,
  UpdatePostStatusRequest,
} from "@/types/post"

const STATUS_TO_INT: Record<PostStatus, number> = { draft: 0, published: 1 }
const INT_TO_STATUS: Record<number, PostStatus> = { 0: "draft", 1: "published" }

function normalizePost(post: Post & { status: PostStatus | number }): Post {
  return {
    ...post,
    status: typeof post.status === "number" ? (INT_TO_STATUS[post.status] ?? "draft") : post.status,
  }
}

interface PaginatedPosts {
  totalCount: number
  page: number
  pageSize: number
  items: Post[]
}

export async function getPosts(params?: { categoryId?: string }): Promise<Post[]> {
  const res = await apiClient.get<ApiResponse<PaginatedPosts>>("/api/v1/posts", {
    params: {
      status: "all",
      pageSize: 1000,
      ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
    },
  })
  const data = res.data.data
  if (!data) return []
  const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : [])
  return items.map(normalizePost)
}

export async function getPost(slug: string): Promise<Post> {
  const res = await apiClient.get<ApiResponse<Post>>(`/api/v1/posts/${slug}`)
  if (!res.data.data) throw new Error("Post not found")
  return normalizePost(res.data.data)
}

export async function createPost(body: CreatePostRequest): Promise<Post> {
  const res = await apiClient.post<ApiResponse<Post>>("/api/v1/posts", {
    ...body,
    status: STATUS_TO_INT[body.status],
  })
  if (!res.data.data) throw new Error("Failed to create post")
  return normalizePost(res.data.data)
}

export async function updatePost(id: string, body: UpdatePostRequest): Promise<Post> {
  const res = await apiClient.put<ApiResponse<Post>>(`/api/v1/posts/${id}`, {
    ...body,
    status: STATUS_TO_INT[body.status],
  })
  if (!res.data.data) throw new Error("Failed to update post")
  return normalizePost(res.data.data)
}

export async function updatePostStatus(id: string, body: UpdatePostStatusRequest): Promise<Post> {
  const res = await apiClient.patch<ApiResponse<Post>>(`/api/v1/posts/${id}/status`, {
    ...body,
    status: STATUS_TO_INT[body.status],
  })
  if (!res.data.data) throw new Error("Failed to update post status")
  return normalizePost(res.data.data)
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/posts/${id}`)
}
