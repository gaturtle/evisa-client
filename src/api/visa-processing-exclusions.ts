import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type { NationalityGroup } from "@/types/nationality-group"

export async function getVisaProcessingExcludedGroups(visaProcessingId: string): Promise<string[]> {
  const res = await apiClient.get<ApiResponse<NationalityGroup[]>>(
    `/api/v1/visa-processing/${visaProcessingId}/excluded-groups`
  )
  return (res.data.data ?? []).map((g) => g.id)
}

export async function addVisaProcessingExcludedGroup(visaProcessingId: string, groupId: string): Promise<void> {
  await apiClient.post(`/api/v1/visa-processing/${visaProcessingId}/excluded-groups/${groupId}`)
}

export async function removeVisaProcessingExcludedGroup(visaProcessingId: string, groupId: string): Promise<void> {
  await apiClient.delete(`/api/v1/visa-processing/${visaProcessingId}/excluded-groups/${groupId}`)
}

export async function setVisaProcessingExcludedGroups(
  visaProcessingId: string,
  groupIds: string[],
  previousGroupIds: string[]
): Promise<void> {
  const toAdd = groupIds.filter((id) => !previousGroupIds.includes(id))
  const toRemove = previousGroupIds.filter((id) => !groupIds.includes(id))
  await Promise.all([
    ...toAdd.map((id) => addVisaProcessingExcludedGroup(visaProcessingId, id)),
    ...toRemove.map((id) => removeVisaProcessingExcludedGroup(visaProcessingId, id)),
  ])
}
