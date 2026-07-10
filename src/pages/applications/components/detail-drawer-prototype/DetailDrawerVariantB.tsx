// PROTOTYPE — Variant B: full-screen inspector. Not a right-edge drawer at all —
// a centered full-screen overlay with a sticky left rail (identity + quick actions,
// always visible) and an independently-scrolling right content pane with jump-to-section nav.
import { useRef, useState } from "react"
import { CheckCircle2, Download, Paperclip, Pencil, Trash2, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { EditApplicationForm } from "../EditApplicationForm"
import { ApplicantPhotos } from "../ApplicantPhotos"
import {
  ALLOWED_TRANSITIONS,
  formatDate,
  REASON_REQUIRED,
  TERMINAL_STATUSES,
  useApplicationDetailState,
} from "./useApplicationDetailState"

const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  [ApplicationStatus.Submitted]:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  [ApplicationStatus.UnderReview]:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  [ApplicationStatus.Approved]:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  [ApplicationStatus.Rejected]: "border-transparent bg-destructive text-white",
  [ApplicationStatus.RequiresAction]:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
  [ApplicationStatus.Cancelled]: "border-transparent bg-secondary text-secondary-foreground",
}

const SECTIONS = ["Contact", "Travel", "Applicants", "Payment", "Actions"] as const
type Section = (typeof SECTIONS)[number]

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

function ApplicantInspectorRow({
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
    <div className="flex flex-col rounded-lg border bg-muted/20 px-4 py-3 text-sm">
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

function InspectorBody({ id, onClose }: { id: string; onClose: () => void }) {
  const [section, setSection] = useState<Section>("Contact")
  const state = useApplicationDetailState(id, onClose)
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
      <div className="flex-1 overflow-y-auto p-6">
        <EditApplicationForm
          id={id}
          detail={detail}
          visaTypes={visaTypes}
          visaProcessings={visaProcessings}
          onCancel={() => setView("detail")}
          onSuccess={() => setView("detail")}
        />
      </div>
    )
  }

  const visaTypeLabel = visaTypes.find((v) => v.id === detail.visaTypeId)?.description ?? detail.visaTypeId
  const processingLabel = visaProcessings.find((p) => p.id === detail.processingOptionId)?.description ?? detail.processingOptionId
  const canEdit = detail.status === ApplicationStatus.Submitted || detail.status === ApplicationStatus.RequiresAction

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left rail — sticky identity + quick nav + quick actions */}
      <div className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-muted/20 p-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {initials(detail.contactFullName)}
          </div>
          <p className="text-sm font-semibold text-foreground">{detail.contactFullName}</p>
          <p className="font-mono text-xs text-muted-foreground">{detail.referenceNumber}</p>
          <Badge className={STATUS_BADGE_CLASSES[detail.status]}>{APPLICATION_STATUS_LABELS[detail.status]}</Badge>
        </div>

        <nav className="flex flex-col gap-0.5">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                section === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t pt-4">
          {canEdit && (
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setView("edit")}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
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
              {downloadMutation.isPending ? "…" : "Download"}
            </Button>
          )}
          <p className="px-1 text-[11px] text-muted-foreground">Created {formatDate(detail.createdDateTime)}</p>
        </div>
      </div>

      {/* Right pane — independently scrolling content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
          {(section === "Contact") && (
            <section>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Contact Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Full Name" value={detail.contactFullName} />
                <Field label="Phone" value={detail.contactPhone} />
                <Field label="Email" value={detail.contactEmail} />
                <Field label="Address" value={detail.contactAddress} />
              </div>
            </section>
          )}

          {section === "Travel" && (
            <section>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Travel Details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-2">
                  <Field label="Purpose of Travel" value={detail.purposeOfTravel} />
                </div>
                <Field label="Entry Date" value={detail.entryDate ? formatDate(detail.entryDate) : null} />
                <Field label="Exit Date" value={detail.exitDate ? formatDate(detail.exitDate) : null} />
                <Field label="Visa Type" value={visaTypeLabel} />
                <Field label="Processing Option" value={processingLabel} />
                {detail.notes && (
                  <div className="col-span-2">
                    <Field label="Notes" value={detail.notes} />
                  </div>
                )}
              </div>
            </section>
          )}

          {section === "Applicants" && (
            <section>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Applicants ({detail.applicants.length})</h3>
              <div className="flex flex-col gap-2">
                {detail.applicants.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">No applicants listed.</p>
                ) : (
                  detail.applicants.map((applicant, i) => (
                    <ApplicantInspectorRow
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
            </section>
          )}

          {section === "Payment" && (
            <section>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Payment</h3>
              {!detail.payment ? (
                <p className="text-sm italic text-muted-foreground">No payment record.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Amount" value={`${detail.payment.currency.toUpperCase()} ${Number(detail.payment.amount).toFixed(2)}`} />
                  <Field label="Payment Status" value={PAYMENT_STATUS_LABELS[detail.payment.status] ?? String(detail.payment.status)} />
                  <div className="col-span-2">
                    <Field label="Stripe Intent ID" value={<span className="font-mono text-xs">{detail.payment.stripeIntentId}</span>} />
                  </div>
                </div>
              )}
            </section>
          )}

          {section === "Actions" && (
            <section className="flex flex-col gap-3">
              <h3 className="mb-1 text-sm font-semibold text-foreground">Status &amp; Actions</h3>
              {TERMINAL_STATUSES.has(detail.status) ? (
                <p className="text-xs italic text-muted-foreground">Status is final — no further changes allowed.</p>
              ) : (
                (() => {
                  const options = ALLOWED_TRANSITIONS[detail.status] ?? []
                  const reasonRequired = selectedStatus !== "" && REASON_REQUIRED.has(selectedStatus as ApplicationStatus)
                  const isDisabled = selectedStatus === "" || statusMutation.isPending || (reasonRequired && !reason.trim())
                  return (
                    <div className="flex max-w-md flex-col gap-2">
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

              {detail.status === ApplicationStatus.Cancelled && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-fit gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
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
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export function DetailDrawerVariantB({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!applicationId} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="top-6 right-6 bottom-6 left-6 max-w-none rounded-xl data-open:slide-in-from-bottom-4 data-closed:slide-out-to-bottom-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {applicationId && <InspectorBody key={applicationId} id={applicationId} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
