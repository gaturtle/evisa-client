import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category"

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<ApiResponse<Category[]>>("/api/v1/categories")
  return res.data.data ?? []
}

export async function createCategory(body: CreateCategoryRequest): Promise<Category> {
  const res = await apiClient.post<ApiResponse<Category>>("/api/v1/categories", body)
  if (!res.data.data) throw new Error("Failed to create category")
  return res.data.data
}

export async function updateCategory(id: string, body: UpdateCategoryRequest): Promise<Category> {
  const res = await apiClient.put<ApiResponse<Category>>(`/api/v1/categories/${id}`, body)
  if (!res.data.data) throw new Error("Failed to update category")
  return res.data.data
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/categories/${id}`)
}
