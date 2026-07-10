// PROTOTYPE — Variant C: timeline-first, dense drawer. Leads with a horizontal status
// stepper instead of a badge, replaces sectioned cards with a dense two-column property
// list (spreadsheet-like rows), and pins actions to a sticky footer bar instead of
// burying them at the bottom of a scroll.
import { useRef } from "react"
import { CheckCircle2, Download, Paperclip, Pencil, Trash2 } from "lucide-react"

import {
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/types/application"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Sheet, SheetCloseButton, SheetContent } from "@/components/ui/sheet"
import { EditApplicationForm } from "../EditApplicationForm"
import { ApplicantPhotos } from "../ApplicantPhotos"
import {
  ALLOWED_TRANSITIONS,
  formatDate,
  REASON_REQUIRED,
  TERMINAL_STATUSES,
  useApplicationDetailState,
} from "./useApplicationDetailState"

const HAPPY_PATH: ApplicationStatus[] = [
  ApplicationStatus.Submitted,
  ApplicationStatus.UnderReview,
  ApplicationStatus.Approved,
]

const DEAD_END_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.Rejected,
  ApplicationStatus.Cancelled,
])

function Stepper({ status }: { status: ApplicationStatus }) {
  const isDeadEnd = DEAD_END_STATUSES.has(status)
  const currentIndex = isDeadEnd ? HAPPY_PATH.length : HAPPY_PATH.indexOf(status === ApplicationStatus.RequiresAction ? ApplicationStatus.UnderReview : status)

  return (
    <div className="flex items-center gap-0 px-5 py-4">
      {HAPPY_PATH.map((step, i) => {
        const isDone = !isDeadEnd && i < currentIndex
        const isCurrent = !isDeadEnd && i === currentIndex
        const isLast = i === HAPPY_PATH.length - 1
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-2 border-primary text-primary"
                      : "border border-border bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {APPLICATION_STATUS_LABELS[step]}
              </span>
            </div>
            {!isLast && <div className={`mx-1.5 h-px flex-1 ${isDone ? "bg-primary" : "bg-border"}`} />}
          </div>
        )
      })}
      {isDeadEnd && (
        <div className="ml-2 flex flex-col items-center gap-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">✕</div>
          <span className="text-[10px] font-medium text-destructive">{APPLICATION_STATUS_LABELS[status]}</span>
        </div>
      )}
      {status === ApplicationStatus.RequiresAction && (
        <div className="ml-2 flex flex-col items-center gap-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">!</div>
          <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">Action</span>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-border/30 px-5 py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-foreground">{value ?? <span className="italic text-muted-foreground/60">—</span>}</span>
    </div>
  )
}

const selectClass =
  "h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

function ApplicantDenseRow({
  applicant,
  index,
  isApproved,
  onUpload,
  uploadPending,
}: {
  applicant: { id: string; firstName: string; lastName: string; nationality: string; portraitPhotoPath: string | null; passportPhotoPath: string | null; documentPath: string | null }
  index: number
  isApproved: boolean
  onUpload: (applicantId: string, file: File) => void
  uploadPending: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasDocument = !!applicant.documentPath

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    onUpload(applicant.id, file)
  }

  return (
    <div className="border-b border-border/30 px-5 py-2">
      <div className="grid grid-cols-[16px_1fr_100px_20px] items-center gap-3 text-xs">
        <span className="text-center text-muted-foreground/60">{index + 1}</span>
        <span className="font-medium text-foreground">
          {applicant.firstName} {applicant.lastName}
        </span>
        <span className="text-muted-foreground">{applicant.nationality}</span>
        {isApproved && (
          <>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            <button
              disabled={uploadPending}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center text-muted-foreground/60 hover:text-foreground disabled:opacity-40"
              title={hasDocument ? "Replace document" : "Upload document"}
            >
              {hasDocument ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Paperclip className="h-3.5 w-3.5" />}
            </button>
          </>
        )}
      </div>
      <ApplicantPhotos portraitPhotoPath={applicant.portraitPhotoPath} passportPhotoPath={applicant.passportPhotoPath} />
    </div>
  )
}

function DrawerBody({ id, onDelete }: { id: string; onDelete: () => void }) {
  const state = useApplicationDetailState(id, onDelete)
  const {
    detail,
    isLoading,
    isError,
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
  } = state

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }
  if (isError || !detail) {
    return <div className="flex flex-1 items-center justify-center text-sm text-destructive">Failed to load application details.</div>
  }
  if (view === "edit") {
    return (
      <EditApplicationForm
        id={id}
        detail={detail}
        visaTypes={visaTypes}
        visaProcessings={visaProcessings}
        onCancel={() => setView("detail")}
        onSuccess={() => setView("detail")}
      />
    )
  }

  const visaTypeLabel = visaTypes.find((v) => v.id === detail.visaTypeId)?.description ?? detail.visaTypeId
  const processingLabel = visaProcessings.find((p) => p.id === detail.processingOptionId)?.description ?? detail.processingOptionId
  const canEdit = detail.status === ApplicationStatus.Submitted || detail.status === ApplicationStatus.RequiresAction
  const options = ALLOWED_TRANSITIONS[detail.status] ?? []
  const reasonRequired = selectedStatus !== "" && REASON_REQUIRED.has(selectedStatus as ApplicationStatus)
  const isDisabled = selectedStatus === "" || statusMutation.isPending || (reasonRequired && !reason.trim())

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b">
        <Stepper status={detail.status} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b py-1">
          <Row label="Reference" value={<span className="font-mono">{detail.referenceNumber}</span>} />
          <Row label="Contact" value={detail.contactFullName} />
          <Row label="Phone" value={detail.contactPhone} />
          <Row label="Email" value={detail.contactEmail} />
          <Row label="Address" value={detail.contactAddress} />
        </div>
        <div className="border-b py-1">
          <Row label="Purpose" value={detail.purposeOfTravel} />
          <Row label="Entry" value={detail.entryDate ? formatDate(detail.entryDate) : null} />
          <Row label="Exit" value={detail.exitDate ? formatDate(detail.exitDate) : null} />
          <Row label="Visa Type" value={visaTypeLabel} />
          <Row label="Processing" value={processingLabel} />
          {detail.notes && <Row label="Notes" value={detail.notes} />}
        </div>

        <div className="border-b px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          Applicants ({detail.applicants.length})
        </div>
        {detail.applicants.length === 0 ? (
          <p className="px-5 py-3 text-xs italic text-muted-foreground">No applicants listed.</p>
        ) : (
          detail.applicants.map((applicant, i) => (
            <ApplicantDenseRow
              key={applicant.id ?? i}
              applicant={applicant}
              index={i}
              isApproved={detail.status === ApplicationStatus.Approved}
              onUpload={(applicantId, file) => uploadMutation.mutate({ applicantId, file })}
              uploadPending={uploadMutation.isPending}
            />
          ))
        )}

        <div className="border-b px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          Payment
        </div>
        {!detail.payment ? (
          <p className="px-5 py-3 text-xs italic text-muted-foreground">No payment record.</p>
        ) : (
          <div className="py-1">
            <Row label="Amount" value={`${detail.payment.currency.toUpperCase()} ${Number(detail.payment.amount).toFixed(2)}`} />
            <Row label="Status" value={PAYMENT_STATUS_LABELS[detail.payment.status] ?? String(detail.payment.status)} />
            <Row label="Stripe ID" value={<span className="font-mono text-[11px]">{detail.payment.stripeIntentId}</span>} />
          </div>
        )}
      </div>

      {/* Sticky footer action bar */}
      <div className="shrink-0 border-t bg-muted/30 px-5 py-3">
        {TERMINAL_STATUSES.has(detail.status) ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs italic text-muted-foreground">Status is final.</p>
            <div className="flex gap-2">
              {detail.status === ApplicationStatus.Approved && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={downloadMutation.isPending}
                  onClick={() => downloadMutation.mutate({ referenceNumber: detail.referenceNumber, email: detail.contactEmail })}
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadMutation.isPending ? "Downloading…" : "Download"}
                </Button>
              )}
              {detail.status === ApplicationStatus.Cancelled && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete application?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete application <span className="font-mono font-medium">{detail.referenceNumber}</span>. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate()}
                      >
                        {deleteMutation.isPending ? "Deleting…" : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex gap-1.5">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value === "" ? "" : (Number(e.target.value) as ApplicationStatus))}
                  className={`${selectClass} flex-1`}
                >
                  <option value="">Change status…</option>
                  {options.map((s) => (
                    <option key={s} value={s}>
                      {APPLICATION_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <input
                  placeholder={reasonRequired ? "Reason (required)" : "Reason (optional)"}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`${selectClass} flex-1`}
                />
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setView("edit")}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            <Button
              size="sm"
              disabled={isDisabled}
              onClick={() => {
                if (selectedStatus !== "") {
                  statusMutation.mutate({ status: selectedStatus as ApplicationStatus, reason: reason || undefined })
                }
              }}
            >
              {statusMutation.isPending ? "Updating…" : "Update"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function DetailDrawerVariantC({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!applicationId} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="max-w-lg">
        <div className="absolute right-3 top-3 z-10">
          <SheetCloseButton />
        </div>
        {applicationId && <DrawerBody key={applicationId} id={applicationId} onDelete={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
