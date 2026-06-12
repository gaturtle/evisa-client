import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/types/api"
import type {
  ApplicationListParams,
  PaginatedApplications,
  UpdateApplicationRequest,
  UpdateStatusRequest,
  VisaApplicationDetail,
} from "@/types/application"

export async function getApplications(
  params: ApplicationListParams
): Promise<PaginatedApplications> {
  const query: Record<string, string | number> = {
    page: params.page,
    pageSize: params.pageSize,
  }
  if (params.status !== undefined) query.status = params.status
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to

  const res = await apiClient.get<ApiResponse<PaginatedApplications>>(
    "/api/v1/applications",
    { params: query }
  )
  return (
    res.data.data ?? { totalCount: 0, page: params.page, pageSize: params.pageSize, items: [] }
  )
}

export async function getApplicationDetail(id: string): Promise<VisaApplicationDetail> {
  const res = await apiClient.get<ApiResponse<VisaApplicationDetail>>(
    `/api/v1/applications/${id}`
  )
  if (!res.data.data) throw new Error("Application not found")
  return res.data.data
}

export async function updateApplicationStatus(
  id: string,
  request: UpdateStatusRequest
): Promise<void> {
  await apiClient.patch(`/api/v1/applications/${id}/status`, request)
}

export async function updateApplication(
  id: string,
  request: UpdateApplicationRequest
): Promise<void> {
  await apiClient.put(`/api/v1/applications/${id}`, request)
}

export async function deleteApplication(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/applications/${id}`)
}

export async function uploadApplicantDocument(
  applicationId: string,
  applicantId: string,
  file: File
): Promise<void> {
  const form = new FormData()
  form.append("file", file)
  await apiClient.post(
    `/api/v1/applications/${applicationId}/applicants/${applicantId}/document`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
}

export async function downloadVisaDocument(
  referenceNumber: string,
  email: string
): Promise<void> {
  const res = await apiClient.get("/api/v1/applications/track/document", {
    params: { referenceNumber, email },
    responseType: "blob",
  })
  const contentType = (res.headers["content-type"] as string) ?? "application/pdf"
  const isZip = contentType.includes("application/zip")
  const url = URL.createObjectURL(
    new Blob([res.data], { type: isZip ? "application/zip" : "application/pdf" })
  )
  const a = document.createElement("a")
  a.href = url
  a.download = `evisa_${referenceNumber}.${isZip ? "zip" : "pdf"}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
