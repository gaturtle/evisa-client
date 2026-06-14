import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  UpdatePostStatusRequest,
} from "@/types/post"

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
  if (Array.isArray(data)) return data
  return Array.isArray(data.items) ? data.items : []
}

export async function createPost(body: CreatePostRequest): Promise<Post> {
  const res = await apiClient.post<ApiResponse<Post>>("/api/v1/posts", body)
  if (!res.data.data) throw new Error("Failed to create post")
  return res.data.data
}

export async function updatePost(id: string, body: UpdatePostRequest): Promise<Post> {
  const res = await apiClient.put<ApiResponse<Post>>(`/api/v1/posts/${id}`, body)
  if (!res.data.data) throw new Error("Failed to update post")
  return res.data.data
}

export async function updatePostStatus(id: string, body: UpdatePostStatusRequest): Promise<Post> {
  const res = await apiClient.patch<ApiResponse<Post>>(`/api/v1/posts/${id}/status`, body)
  if (!res.data.data) throw new Error("Failed to update post status")
  return res.data.data
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/posts/${id}`)
}
