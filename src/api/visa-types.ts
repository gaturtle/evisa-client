import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type {
  CreateVisaTypeRequest,
  UpdateVisaTypeRequest,
  VisaType,
} from "@/types/visa-type"

export async function getVisaTypes(): Promise<VisaType[]> {
  const res = await apiClient.get<ApiResponse<VisaType[]>>("/api/v1/visa-type")
  return res.data.data ?? []
}

export async function getVisaType(id: string): Promise<VisaType> {
  const res = await apiClient.get<ApiResponse<VisaType>>(`/api/v1/visa-type/${id}`)
  if (!res.data.data) throw new Error("Visa type not found")
  return res.data.data
}

export async function createVisaType(body: CreateVisaTypeRequest): Promise<VisaType> {
  const res = await apiClient.post<ApiResponse<VisaType>>("/api/v1/visa-type", body)
  if (!res.data.data) throw new Error("Failed to create visa type")
  return res.data.data
}

export async function updateVisaType(id: string, body: UpdateVisaTypeRequest): Promise<VisaType> {
  const res = await apiClient.put<ApiResponse<VisaType>>(`/api/v1/visa-type/${id}`, body)
  if (!res.data.data) throw new Error("Failed to update visa type")
  return res.data.data
}

export async function deleteVisaType(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/visa-type/${id}`)
}
