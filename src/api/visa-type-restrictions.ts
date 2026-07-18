import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type { NationalityGroup } from "@/types/nationality-group"
import type { VisaNationality } from "@/types/nationality"

export async function getVisaTypeRestrictedGroups(visaTypeId: string): Promise<string[]> {
  const res = await apiClient.get<ApiResponse<NationalityGroup[]>>(
    `/api/v1/visa-type/${visaTypeId}/restricted-groups`
  )
  return (res.data.data ?? []).map((g) => g.id)
}

export async function addVisaTypeRestrictedGroup(visaTypeId: string, groupId: string): Promise<void> {
  await apiClient.post(`/api/v1/visa-type/${visaTypeId}/restricted-groups/${groupId}`)
}

export async function removeVisaTypeRestrictedGroup(visaTypeId: string, groupId: string): Promise<void> {
  await apiClient.delete(`/api/v1/visa-type/${visaTypeId}/restricted-groups/${groupId}`)
}

export async function setVisaTypeRestrictedGroups(
  visaTypeId: string,
  groupIds: string[],
  previousGroupIds: string[]
): Promise<void> {
  const toAdd = groupIds.filter((id) => !previousGroupIds.includes(id))
  const toRemove = previousGroupIds.filter((id) => !groupIds.includes(id))
  await Promise.all([
    ...toAdd.map((id) => addVisaTypeRestrictedGroup(visaTypeId, id)),
    ...toRemove.map((id) => removeVisaTypeRestrictedGroup(visaTypeId, id)),
  ])
}

export async function getVisaTypeExceptions(visaTypeId: string): Promise<VisaNationality[]> {
  const res = await apiClient.get<ApiResponse<VisaNationality[]>>(
    `/api/v1/visa-type/${visaTypeId}/exceptions`
  )
  return res.data.data ?? []
}

export async function addVisaTypeException(visaTypeId: string, nationalityId: string): Promise<void> {
  await apiClient.post(`/api/v1/visa-type/${visaTypeId}/exceptions`, { nationalityId })
}

export async function removeVisaTypeException(visaTypeId: string, nationalityId: string): Promise<void> {
  await apiClient.delete(`/api/v1/visa-type/${visaTypeId}/exceptions`, { data: { nationalityId } })
}
