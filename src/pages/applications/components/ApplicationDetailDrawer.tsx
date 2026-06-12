import { useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CheckCircle2, Download, Paperclip, Pencil, Trash2 } from "lucide-react"

import {
  getApplicationDetail,
  updateApplicationStatus,
  uploadApplicantDocument,
  downloadVisaDocument,
  deleteApplication,
} from "@/api/applications"
import { getVisaTypes } from "@/api/visa-types"
import { getVisaProcessings } from "@/api/visa-processings"
import { getNationalities } from "@/api/nationalities"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { EditApplicationForm } from "./EditApplicationForm"

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
  [ApplicationStatus.Cancelled]:
    "border-transparent bg-secondary text-secondary-foreground",
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b px-5 py-4 last:border-b-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value ?? <span className="italic text-muted-foreground/60">—</span>}</span>
    </div>
  )
}

const TERMINAL_STATUSES = new Set<ApplicationStatus>([
  ApplicationStatus.Approved,
  ApplicationStatus.Rejected,
  ApplicationStatus.Cancelled,
])

const ALLOWED_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
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

const REASON_REQUIRED = new Set<ApplicationStatus>([
  ApplicationStatus.Rejected,
  ApplicationStatus.RequiresAction,
])

const selectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

function ApplicantRow({
  applicant,
  index,
  applicationId,
  isApproved,
}: {
  applicant: { id: string; firstName: string; lastName: string; documentPath: string | null }
  index: number
  applicationId: string
  isApproved: boolean
}) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadApplicantDocument(applicationId, applicant.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", applicationId] })
      toast.success(`Document uploaded for ${applicant.firstName} ${applicant.lastName}.`)
    },
    onError: () => toast.error(`Failed to upload document for ${applicant.firstName} ${applicant.lastName}.`),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File exceeds the 10 MB limit.")
      return
    }
    uploadMutation.mutate(file)
  }

  const hasDocument = !!applicant.documentPath

  return (
    <div className="flex items-center gap-4 px-3 py-2.5 text-sm">
      <span className="w-5 shrink-0 text-center text-xs text-muted-foreground/60">{index + 1}</span>
      <span className="flex-1 font-medium text-foreground/80">
        {applicant.firstName} {applicant.lastName}
      </span>
      {isApproved && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-40"
            title={hasDocument ? "Replace document" : "Upload document"}
          >
            {uploadMutation.isPending ? (
              <span className="text-xs">…</span>
            ) : hasDocument ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>
        </>
      )}
    </div>
  )
}

function DrawerBody({ id, onDelete }: { id: string; onDelete: () => void }) {
  const queryClient = useQueryClient()
  const [view, setView] = useState<"detail" | "edit">("detail")
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "">("")
  const [reason, setReason] = useState("")

  const { data: detail, isLoading, isError } = useQuery({
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

  const { data: nationalities = [] } = useQuery({
    queryKey: ["nationalities"],
    queryFn: getNationalities,
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
      onDelete()
    },
    onError: () => toast.error("Failed to delete application."),
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-destructive">
        Failed to load application details.
      </div>
    )
  }

  if (view === "edit") {
    return (
      <EditApplicationForm
        id={id}
        detail={detail}
        visaTypes={visaTypes}
        visaProcessings={visaProcessings}
        nationalities={nationalities}
        onCancel={() => setView("detail")}
        onSuccess={() => setView("detail")}
      />
    )
  }

  const visaTypeLabel =
    visaTypes.find((v) => v.id === detail.visaTypeId)?.description ?? detail.visaTypeId
  const processingLabel =
    visaProcessings.find((p) => p.id === detail.processingOptionId)?.description ??
    detail.processingOptionId

  return (
    <ScrollArea className="h-full">
      <Section title="Contact Information">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Full Name" value={detail.contactFullName} />
          <Field label="Phone" value={detail.contactPhone} />
          <Field label="Email" value={detail.contactEmail} />
          <Field label="Address" value={detail.contactAddress} />
        </div>
      </Section>

      <Section title="Travel Details">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="col-span-2">
            <Field label="Purpose of Travel" value={detail.purposeOfTravel} />
          </div>
          <Field label="Entry Date" value={detail.entryDate ? formatDate(detail.entryDate) : null} />
          <Field label="Exit Date" value={detail.exitDate ? formatDate(detail.exitDate) : null} />
          <Field label="Visa Type" value={visaTypeLabel} />
          <Field label="Processing Option" value={processingLabel} />
          {detail.processingStartDate && (
            <Field label="Processing Started" value={formatDate(detail.processingStartDate)} />
          )}
          {detail.completedDateTime && (
            <Field label="Completed" value={formatDate(detail.completedDateTime)} />
          )}
        </div>
      </Section>

      {detail.notes && (
        <Section title="Notes">
          <Field label="Notes" value={detail.notes} />
        </Section>
      )}

      <Section title={`Applicants (${detail.applicants.length})`}>
        {detail.applicants.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No applicants listed.</p>
        ) : (
          <div className="divide-y divide-border/40 rounded-md border">
            {detail.applicants.map((applicant, i) => (
              <ApplicantRow
                key={applicant.id ?? i}
                applicant={applicant}
                index={i}
                applicationId={id}
                isApproved={detail.status === ApplicationStatus.Approved}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Payment">
        {!detail.payment ? (
          <p className="text-sm text-muted-foreground italic">No payment record.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Field
              label="Amount"
              value={`${detail.payment.currency.toUpperCase()} ${Number(detail.payment.amount).toFixed(2)}`}
            />
            <Field
              label="Payment Status"
              value={PAYMENT_STATUS_LABELS[detail.payment.status] ?? String(detail.payment.status)}
            />
            <div className="col-span-2">
              <Field
                label="Stripe Intent ID"
                value={
                  <span className="font-mono text-xs">{detail.payment.stripeIntentId}</span>
                }
              />
            </div>
          </div>
        )}
      </Section>

      <Section title="Actions">
        <div className="flex flex-col gap-3">
          {(detail.status === ApplicationStatus.Submitted ||
            detail.status === ApplicationStatus.RequiresAction) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setView("edit")}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Application
            </Button>
          )}
          {TERMINAL_STATUSES.has(detail.status) ? (
            <p className="text-xs text-muted-foreground italic">
              Status is final — no further changes allowed.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {(() => {
                const options = ALLOWED_TRANSITIONS[detail.status] ?? []
                const reasonRequired =
                  selectedStatus !== "" && REASON_REQUIRED.has(selectedStatus as ApplicationStatus)
                const isDisabled =
                  selectedStatus === "" ||
                  statusMutation.isPending ||
                  (reasonRequired && !reason.trim())
                return (
                  <>
                    <div className="flex gap-2">
                      <select
                        value={selectedStatus}
                        onChange={(e) =>
                          setSelectedStatus(
                            e.target.value === "" ? "" : (Number(e.target.value) as ApplicationStatus)
                          )
                        }
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
                            statusMutation.mutate({
                              status: selectedStatus as ApplicationStatus,
                              reason: reason || undefined,
                            })
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
                  </>
                )
              })()}
            </div>
          )}

          {detail.status === ApplicationStatus.Approved && (() => {
            const allDocsReady = detail.applicants.length > 0 && detail.applicants.every(a => a.documentPath !== null)
            const missingCount = detail.applicants.filter(a => a.documentPath === null).length
            return (
              <div className="flex flex-col gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  disabled={!allDocsReady || downloadMutation.isPending}
                  onClick={() =>
                    downloadMutation.mutate({
                      referenceNumber: detail.referenceNumber,
                      email: detail.contactEmail,
                    })
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadMutation.isPending
                    ? "Downloading…"
                    : detail.applicants.length > 1
                      ? `Download Visas (${detail.applicants.length})`
                      : "Download Visa"}
                </Button>
                {!allDocsReady && (
                  <p className="text-xs italic text-muted-foreground">
                    {missingCount} document{missingCount !== 1 ? "s" : ""} missing — upload all to enable download.
                  </p>
                )}
              </div>
            )
          })()}

          {detail.status === ApplicationStatus.Cancelled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Application
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete application{" "}
                    <span className="font-mono font-medium">{detail.referenceNumber}</span>. This
                    action cannot be undone.
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
      </Section>
    </ScrollArea>
  )
}

interface ApplicationDetailDrawerProps {
  applicationId: string | null
  onClose: () => void
}

export function ApplicationDetailDrawer({ applicationId, onClose }: ApplicationDetailDrawerProps) {
  const { data: detail } = useQuery({
    queryKey: ["application-detail", applicationId],
    queryFn: () => getApplicationDetail(applicationId!),
    enabled: !!applicationId,
  })

  return (
    <Sheet open={!!applicationId} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent>
        <SheetHeader>
          <div className="flex flex-col gap-1">
            <SheetTitle>
              {detail ? `Application #${detail.referenceNumber}` : "Application Detail"}
            </SheetTitle>
            <SheetDescription>
              {detail
                ? `Created ${formatDate(detail.createdDateTime)}`
                : applicationId ?? ""}
            </SheetDescription>
          </div>
          <div className="flex items-center gap-2">
            {detail && (
              <Badge className={STATUS_BADGE_CLASSES[detail.status]}>
                {APPLICATION_STATUS_LABELS[detail.status]}
              </Badge>
            )}
            <SheetCloseButton />
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {applicationId && <DrawerBody key={applicationId} id={applicationId} onDelete={onClose} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
