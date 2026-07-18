import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type {
  CreateNationalityGroupRequest,
  NationalityGroup,
  UpdateNationalityGroupRequest,
} from "@/types/nationality-group"

export async function getNationalityGroups(): Promise<NationalityGroup[]> {
  const res = await apiClient.get<ApiResponse<NationalityGroup[]>>("/api/v1/nationality-group")
  return res.data.data ?? []
}

export async function createNationalityGroup(body: CreateNationalityGroupRequest): Promise<NationalityGroup> {
  const res = await apiClient.post<ApiResponse<NationalityGroup>>("/api/v1/nationality-group", body)
  if (!res.data.data) throw new Error("Failed to create nationality group")
  return res.data.data
}

export async function updateNationalityGroup(id: string, body: UpdateNationalityGroupRequest): Promise<NationalityGroup> {
  const res = await apiClient.put<ApiResponse<NationalityGroup>>(`/api/v1/nationality-group/${id}`, body)
  if (!res.data.data) throw new Error("Failed to update nationality group")
  return res.data.data
}

export async function deleteNationalityGroup(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/nationality-group/${id}`)
}
