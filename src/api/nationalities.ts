import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type {
  CreateNationalityRequest,
  UpdateNationalityRequest,
  VisaNationality,
} from "@/types/nationality"

export async function getNationalities(): Promise<VisaNationality[]> {
  const res = await apiClient.get<ApiResponse<VisaNationality[]>>("/api/v1/nationality")
  return res.data.data ?? []
}

export async function getNationality(id: string): Promise<VisaNationality> {
  const res = await apiClient.get<ApiResponse<VisaNationality>>(`/api/v1/nationality/${id}`)
  if (!res.data.data) throw new Error("Nationality not found")
  return res.data.data
}

export async function createNationality(body: CreateNationalityRequest): Promise<VisaNationality> {
  const res = await apiClient.post<ApiResponse<VisaNationality>>("/api/v1/nationality", body)
  if (!res.data.data) throw new Error("Failed to create nationality")
  return res.data.data
}

export async function updateNationality(id: string, body: UpdateNationalityRequest): Promise<VisaNationality> {
  const res = await apiClient.put<ApiResponse<VisaNationality>>(`/api/v1/nationality/${id}`, body)
  if (!res.data.data) throw new Error("Failed to update nationality")
  return res.data.data
}

export async function deleteNationality(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/nationality/${id}`)
}
