// PROTOTYPE — Variant A: tabbed sheet. Same right slide-over shell as production,
// but content is split into tabs instead of one long scroll, and the header is a
// compact identity strip (avatar initials + inline meta) instead of stacked title/desc.
import { useRef, useState } from "react"
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

const STATUS_DOT: Record<ApplicationStatus, string> = {
  [ApplicationStatus.Submitted]: "bg-blue-500",
  [ApplicationStatus.UnderReview]: "bg-amber-500",
  [ApplicationStatus.Approved]: "bg-green-500",
  [ApplicationStatus.Rejected]: "bg-destructive",
  [ApplicationStatus.RequiresAction]: "bg-orange-500",
  [ApplicationStatus.Cancelled]: "bg-secondary-foreground/50",
}

const TABS = ["Overview", "Applicants", "Payment", "Actions"] as const
type Tab = (typeof TABS)[number]

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">
        {value ?? <span className="italic text-muted-foreground/60">—</span>}
      </span>
    </div>
  )
}

const selectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

function ApplicantTabRow({
  applicant,
  index,
  isApproved,
  onUpload,
  uploadPending,
}: {
  applicant: { id: string; firstName: string; lastName: string; portraitPhotoPath: string | null; passportPhotoPath: string | null; documentPath: string | null }
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
    <div className="flex flex-col rounded-lg border px-3 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="w-5 shrink-0 text-center text-xs text-muted-foreground/60">{index + 1}</span>
        <span className="flex-1 font-medium text-foreground/80">
          {applicant.firstName} {applicant.lastName}
        </span>
        {isApproved && (
          <>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            <button
              disabled={uploadPending}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-40"
              title={hasDocument ? "Replace document" : "Upload document"}
            >
              {hasDocument ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Paperclip className="h-4 w-4" />}
            </button>
          </>
        )}
      </div>
      <ApplicantPhotos portraitPhotoPath={applicant.portraitPhotoPath} passportPhotoPath={applicant.passportPhotoPath} />
    </div>
  )
}

function DrawerBody({ id, onDelete }: { id: string; onDelete: () => void }) {
  const [tab, setTab] = useState<Tab>("Overview")
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials(detail.contactFullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{detail.contactFullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {detail.referenceNumber} · Created {formatDate(detail.createdDateTime)}
          </p>
        </div>
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[detail.status]}`} />
        <span className="shrink-0 text-xs font-medium text-foreground/80">{APPLICATION_STATUS_LABELS[detail.status]}</span>
      </div>

      <div className="flex shrink-0 gap-1 border-b px-5 pt-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-md px-3 py-2 text-xs font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-primary text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {t === "Applicants" && ` (${detail.applicants.length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "Overview" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Contact</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Phone" value={detail.contactPhone} />
                <Field label="Email" value={detail.contactEmail} />
                <div className="col-span-2">
                  <Field label="Address" value={detail.contactAddress} />
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Travel</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="col-span-2">
                  <Field label="Purpose of Travel" value={detail.purposeOfTravel} />
                </div>
                <Field label="Entry Date" value={detail.entryDate ? formatDate(detail.entryDate) : null} />
                <Field label="Exit Date" value={detail.exitDate ? formatDate(detail.exitDate) : null} />
                <Field label="Visa Type" value={visaTypeLabel} />
                <Field label="Processing Option" value={processingLabel} />
              </div>
            </div>
            {detail.notes && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Notes</h3>
                <p className="text-sm text-foreground">{detail.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === "Applicants" && (
          <div className="flex flex-col gap-2">
            {detail.applicants.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">No applicants listed.</p>
            ) : (
              detail.applicants.map((applicant, i) => (
                <ApplicantTabRow
                  key={applicant.id ?? i}
                  applicant={applicant}
                  index={i}
                  isApproved={detail.status === ApplicationStatus.Approved}
                  onUpload={(applicantId, file) => uploadMutation.mutate({ applicantId, file })}
                  uploadPending={uploadMutation.isPending}
                />
              ))
            )}
          </div>
        )}

        {tab === "Payment" && (
          <div>
            {!detail.payment ? (
              <p className="text-sm italic text-muted-foreground">No payment record.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Amount" value={`${detail.payment.currency.toUpperCase()} ${Number(detail.payment.amount).toFixed(2)}`} />
                <Field label="Payment Status" value={PAYMENT_STATUS_LABELS[detail.payment.status] ?? String(detail.payment.status)} />
                <div className="col-span-2">
                  <Field label="Stripe Intent ID" value={<span className="font-mono text-xs">{detail.payment.stripeIntentId}</span>} />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "Actions" && (
          <div className="flex flex-col gap-3">
            {canEdit && (
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setView("edit")}>
                <Pencil className="h-3.5 w-3.5" />
                Edit Application
              </Button>
            )}
            {TERMINAL_STATUSES.has(detail.status) ? (
              <p className="text-xs italic text-muted-foreground">Status is final — no further changes allowed.</p>
            ) : (
              (() => {
                const options = ALLOWED_TRANSITIONS[detail.status] ?? []
                const reasonRequired = selectedStatus !== "" && REASON_REQUIRED.has(selectedStatus as ApplicationStatus)
                const isDisabled = selectedStatus === "" || statusMutation.isPending || (reasonRequired && !reason.trim())
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value === "" ? "" : (Number(e.target.value) as ApplicationStatus))}
                        className={`${selectClass} flex-1`}
                      >
                        <option value="">Select new status…</option>
                        {options.map((s) => (
                          <option key={s} value={s}>
                            {APPLICATION_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={isDisabled}
                        onClick={() => {
                          if (selectedStatus !== "") {
                            statusMutation.mutate({ status: selectedStatus as ApplicationStatus, reason: reason || undefined })
                          }
                        }}
                      >
                        {statusMutation.isPending ? "Updating…" : "Update Status"}
                      </Button>
                    </div>
                    <textarea
                      placeholder={reasonRequired ? "Reason (required)" : "Reason (optional)"}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                )
              })()
            )}

            {detail.status === ApplicationStatus.Approved && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                disabled={downloadMutation.isPending}
                onClick={() => downloadMutation.mutate({ referenceNumber: detail.referenceNumber, email: detail.contactEmail })}
              >
                <Download className="h-3.5 w-3.5" />
                {downloadMutation.isPending ? "Downloading…" : "Download Visa"}
              </Button>
            )}

            {detail.status === ApplicationStatus.Cancelled && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Application
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
        )}
      </div>
    </div>
  )
}

export function DetailDrawerVariantA({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!applicationId} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent>
        <div className="absolute right-3 top-3 z-10">
          <SheetCloseButton />
        </div>
        {applicationId && <DrawerBody key={applicationId} id={applicationId} onDelete={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
