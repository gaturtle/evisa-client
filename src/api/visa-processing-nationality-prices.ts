import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type { VisaProcessingNationalityPrice } from "@/types/visa-processing-nationality-price"

export async function getVisaProcessingNationalityPrices(
  visaProcessingId: string
): Promise<VisaProcessingNationalityPrice[]> {
  const res = await apiClient.get<ApiResponse<VisaProcessingNationalityPrice[]>>(
    `/api/v1/visa-processing/${visaProcessingId}/nationality-prices`
  )
  return res.data.data ?? []
}

export async function setVisaProcessingNationalityPrice(
  visaProcessingId: string,
  nationalityId: string,
  price: number
): Promise<void> {
  await apiClient.post(`/api/v1/visa-processing/${visaProcessingId}/nationality-prices`, { nationalityId, price })
}

export async function removeVisaProcessingNationalityPrice(
  visaProcessingId: string,
  nationalityId: string
): Promise<void> {
  await apiClient.delete(`/api/v1/visa-processing/${visaProcessingId}/nationality-prices`, {
    data: { nationalityId },
  })
}
