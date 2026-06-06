import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type {
  CreateVisaProcessingRequest,
  UpdateVisaProcessingRequest,
  VisaProcessing,
} from "@/types/visa-processing"

export async function getVisaProcessings(): Promise<VisaProcessing[]> {
  const res = await apiClient.get<ApiResponse<VisaProcessing[]>>("/api/v1/visa-processing")
  return res.data.data ?? []
}

export async function getVisaProcessing(id: string): Promise<VisaProcessing> {
  const res = await apiClient.get<ApiResponse<VisaProcessing>>(`/api/v1/visa-processing/${id}`)
  if (!res.data.data) throw new Error("Visa processing not found")
  return res.data.data
}

export async function createVisaProcessing(body: CreateVisaProcessingRequest): Promise<VisaProcessing> {
  const res = await apiClient.post<ApiResponse<VisaProcessing>>("/api/v1/visa-processing", body)
  if (!res.data.data) throw new Error("Failed to create visa processing")
  return res.data.data
}

export async function updateVisaProcessing(id: string, body: UpdateVisaProcessingRequest): Promise<VisaProcessing> {
  const res = await apiClient.put<ApiResponse<VisaProcessing>>(`/api/v1/visa-processing/${id}`, body)
  if (!res.data.data) throw new Error("Failed to update visa processing")
  return res.data.data
}

export async function deleteVisaProcessing(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/visa-processing/${id}`)
}
