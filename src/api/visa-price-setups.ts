import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type {
  CreateVisaPriceSetupRequest,
  UpdateVisaPriceSetupRequest,
  VisaPriceSetup,
} from "@/types/visa-price-setup"

export async function getVisaPriceSetups(): Promise<VisaPriceSetup[]> {
  const res = await apiClient.get<ApiResponse<VisaPriceSetup[]>>("/api/v1/visa-price-setup")
  return res.data.data ?? []
}

export async function getVisaPriceSetup(id: string): Promise<VisaPriceSetup> {
  const res = await apiClient.get<ApiResponse<VisaPriceSetup>>(`/api/v1/visa-price-setup/${id}`)
  if (!res.data.data) throw new Error("Visa price setup not found")
  return res.data.data
}

export async function createVisaPriceSetup(body: CreateVisaPriceSetupRequest): Promise<VisaPriceSetup> {
  const res = await apiClient.post<ApiResponse<VisaPriceSetup>>("/api/v1/visa-price-setup", body)
  if (!res.data.data) throw new Error("Failed to create visa price setup")
  return res.data.data
}

export async function updateVisaPriceSetup(id: string, body: UpdateVisaPriceSetupRequest): Promise<VisaPriceSetup> {
  const res = await apiClient.put<ApiResponse<VisaPriceSetup>>(`/api/v1/visa-price-setup/${id}`, body)
  if (!res.data.data) throw new Error("Failed to update visa price setup")
  return res.data.data
}

export async function deleteVisaPriceSetup(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/visa-price-setup/${id}`)
}
