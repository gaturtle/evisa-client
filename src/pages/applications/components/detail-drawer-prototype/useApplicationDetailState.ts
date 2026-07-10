// PROTOTYPE — shared data/mutation logic reused by the detail-drawer UI variants.
// Mirrors ApplicationDetailDrawer.tsx's DrawerBody so every variant hits the real API.
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getApplicationDetail,
  updateApplicationStatus,
  uploadApplicantDocument,
  downloadVisaDocument,
  deleteApplication,
} from "@/api/applications"
import { getVisaTypes } from "@/api/visa-types"
import { getVisaProcessings } from "@/api/visa-processings"
import { ApplicationStatus } from "@/types/application"

export const TERMINAL_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.Approved,
  ApplicationStatus.Rejected,
  ApplicationStatus.Cancelled,
])

export const ALLOWED_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  [ApplicationStatus.Submitted]: [
    ApplicationStatus.UnderReview,
    ApplicationStatus.RequiresAction,
    ApplicationStatus.Rejected,
    ApplicationStatus.Cancelled,
  ],
  [ApplicationStatus.UnderReview]: [
    ApplicationStatus.Approved,
    ApplicationStatus.Rejected,
    ApplicationStatus.RequiresAction,
    ApplicationStatus.Cancelled,
  ],
  [ApplicationStatus.RequiresAction]: [
    ApplicationStatus.UnderReview,
    ApplicationStatus.Rejected,
    ApplicationStatus.Cancelled,
  ],
}

export const REASON_REQUIRED = new Set<ApplicationStatus>([
  ApplicationStatus.Rejected,
  ApplicationStatus.RequiresAction,
])

export function useApplicationDetailState(id: string, onDeleted: () => void) {
  const queryClient = useQueryClient()
  const [view, setView] = useState<"detail" | "edit">("detail")
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "">("")
  const [reason, setReason] = useState("")

  const detailQuery = useQuery({
    queryKey: ["application-detail", id],
    queryFn: () => getApplicationDetail(id),
  })

  const { data: visaTypes = [] } = useQuery({
    queryKey: ["visa-types"],
    queryFn: getVisaTypes,
  })

  const { data: visaProcessings = [] } = useQuery({
    queryKey: ["visa-processings"],
    queryFn: getVisaProcessings,
  })

  const statusMutation = useMutation({
    mutationFn: ({ status, reason: r }: { status: ApplicationStatus; reason?: string }) =>
      updateApplicationStatus(id, { status, reason: r }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] })
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      toast.success("Status updated.")
      setReason("")
      setSelectedStatus("")
    },
    onError: () => toast.error("Failed to update status."),
  })

  const downloadMutation = useMutation({
    mutationFn: ({ referenceNumber, email }: { referenceNumber: string; email: string }) =>
      downloadVisaDocument(referenceNumber, email),
    onError: () => toast.error("Failed to download document."),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      toast.success("Application deleted.")
      onDeleted()
    },
    onError: () => toast.error("Failed to delete application."),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ applicantId, file }: { applicantId: string; file: File }) =>
      uploadApplicantDocument(id, applicantId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] })
      toast.success("Document uploaded.")
    },
    onError: () => toast.error("Failed to upload document."),
  })

  return {
    detail: detailQuery.data,
    isLoading: detailQuery.isLoading,
    isError: detailQuery.isError,
    visaTypes,
    visaProcessings,
    view,
    setView,
    selectedStatus,
    setSelectedStatus,
    reason,
    setReason,
    statusMutation,
    downloadMutation,
    deleteMutation,
    uploadMutation,
  }
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}
