import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type { CreateHolidayRequest, Holiday } from "@/types/holiday"

export async function getHolidays(year: number): Promise<Holiday[]> {
  const res = await apiClient.get<ApiResponse<Holiday[]>>("/api/v1/holidays", {
    params: { year },
  })
  return res.data.data ?? []
}

export async function createHoliday(body: CreateHolidayRequest): Promise<Holiday> {
  const res = await apiClient.post<ApiResponse<Holiday>>("/api/v1/holidays", body)
  if (!res.data.data) throw new Error("Failed to create holiday")
  return res.data.data
}

export async function deleteHoliday(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/holidays/${id}`)
}
