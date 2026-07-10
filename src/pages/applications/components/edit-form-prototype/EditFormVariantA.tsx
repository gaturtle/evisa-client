// PROTOTYPE — throwaway. Variant A: stepped wizard.
// Breaks the edit form into four guided steps (Contact -> Travel & Visa -> Applicants -> Review)
// instead of one long scroll. Answers: does a guided, one-thing-at-a-time flow reduce the chance
// of a reviewer missing a required field on a form this dense?
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

import { updateApplication } from "@/api/applications"
import type { UpdateApplicationRequest, VisaApplicationDetail } from "@/types/application"
import type { VisaType } from "@/types/visa-type"
import type { VisaProcessing } from "@/types/visa-processing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApplicantPhotos } from "../ApplicantPhotos"

const applicantSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  nationality: z.string().min(1, "Required"),
})

const formSchema = z.object({
  contactFullName: z.string().min(1, "Required"),
  contactPhone: z.string().min(1, "Required"),
  contactEmail: z.string().email("Invalid email"),
  contactAddress: z.string().min(1, "Required"),
  entryDate: z.string().min(1, "Required"),
  exitDate: z.string().min(1, "Required"),
  visaTypeId: z.string().min(1, "Required"),
  processingOptionId: z.string().min(1, "Required"),
  notes: z.string().optional(),
  applicants: z.array(applicantSchema).min(1, "At least one applicant is required"),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  id: string
  detail: VisaApplicationDetail
  visaTypes: VisaType[]
  visaProcessings: VisaProcessing[]
  onCancel: () => void
  onSuccess: () => void
}

const STEPS = ["Contact", "Travel & Visa", "Applicants", "Review"] as const
type StepFieldMap = Record<number, (keyof FormValues)[]>
const STEP_FIELDS: StepFieldMap = {
  0: ["contactFullName", "contactPhone", "contactEmail", "contactAddress"],
  1: ["entryDate", "exitDate", "visaTypeId", "processingOptionId"],
  2: ["applicants"],
  3: [],
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function EditFormVariantA({ id, detail, visaTypes, visaProcessings, onCancel, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [maxVisited, setMaxVisited] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactFullName: detail.contactFullName,
      contactPhone: detail.contactPhone,
      contactEmail: detail.contactEmail,
      contactAddress: detail.contactAddress,
      entryDate: detail.entryDate?.slice(0, 10) ?? "",
      exitDate: detail.exitDate?.slice(0, 10) ?? "",
      visaTypeId: detail.visaTypeId,
      processingOptionId: detail.processingOptionId,
      notes: detail.notes ?? "",
      applicants: detail.applicants.map((a) => ({
        firstName: a.firstName,
        lastName: a.lastName,
        nationality: a.nationality,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "applicants" })
  const values = form.watch()

  const mutation = useMutation({
    mutationFn: (vals: FormValues) => {
      const request: UpdateApplicationRequest = {
        contactFullName: vals.contactFullName,
        contactPhone: vals.contactPhone,
        contactEmail: vals.contactEmail,
        contactAddress: vals.contactAddress,
        entryDate: `${vals.entryDate}T00:00:00`,
        exitDate: `${vals.exitDate}T00:00:00`,
        visaTypeId: vals.visaTypeId,
        processingOptionId: vals.processingOptionId,
        isUrgentProcessing: detail.isUrgentProcessing,
        isMultipleEntry: detail.isMultipleEntry,
        isAirportTransfer: detail.isAirportTransfer,
        isOther: detail.isOther,
        notes: vals.notes || undefined,
        applicants: vals.applicants,
      }
      return updateApplication(id, request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", id] })
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      toast.success("Application updated.")
      onSuccess()
    },
    onError: () => toast.error("Failed to update application."),
  })

  const { errors } = form.formState

  async function goToStep(target: number) {
    if (target > step) {
      const ok = await form.trigger(STEP_FIELDS[step])
      if (!ok) return
    }
    setStep(target)
    setMaxVisited((m) => Math.max(m, target))
  }

  async function handleNext() {
    if (step === STEPS.length - 1) {
      form.handleSubmit((vals) => mutation.mutate(vals))()
      return
    }
    await goToStep(step + 1)
  }

  const visaTypeLabel = visaTypes.find((v) => v.id === values.visaTypeId)?.description ?? "—"
  const processingLabel = visaProcessings.find((p) => p.id === values.processingOptionId)?.description ?? "—"

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-5 py-4">
        {STEPS.map((label, i) => {
          const isDone = i < step
          const isCurrent = i === step
          const isReachable = i <= maxVisited
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!isReachable && i !== step + 1}
                onClick={() => goToStep(i)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                } ${isReachable || i === step + 1 ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              >
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </button>
              <span
                className={`hidden text-xs font-medium sm:block ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Full Name *</Label>
              <Input {...form.register("contactFullName")} />
              <FieldError message={errors.contactFullName?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Phone *</Label>
              <Input {...form.register("contactPhone")} />
              <FieldError message={errors.contactPhone?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Email *</Label>
              <Input type="email" {...form.register("contactEmail")} />
              <FieldError message={errors.contactEmail?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Address *</Label>
              <Input {...form.register("contactAddress")} />
              <FieldError message={errors.contactAddress?.message} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Entry Date *</Label>
                <Input type="date" {...form.register("entryDate")} />
                <FieldError message={errors.entryDate?.message} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Exit Date *</Label>
                <Input type="date" {...form.register("exitDate")} />
                <FieldError message={errors.exitDate?.message} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Visa Type *</Label>
              <select {...form.register("visaTypeId")} className={selectClass}>
                <option value="">Select visa type…</option>
                {visaTypes.map((v) => (
                  <option key={v.id} value={v.id}>{v.description}</option>
                ))}
              </select>
              <FieldError message={errors.visaTypeId?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Processing Option *</Label>
              <select {...form.register("processingOptionId")} className={selectClass}>
                <option value="">Select processing…</option>
                {visaProcessings.map((p) => (
                  <option key={p.id} value={p.id}>{p.description}</option>
                ))}
              </select>
              <FieldError message={errors.processingOptionId?.message} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Applicants ({fields.length})
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => append({ firstName: "", lastName: "", nationality: "" })}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            {errors.applicants?.root && <FieldError message={errors.applicants.root.message} />}
            {fields.map((field, i) => (
              <div key={field.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground/60">Applicant {i + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <ApplicantPhotos
                  portraitPhotoPath={detail.applicants[i]?.portraitPhotoPath ?? null}
                  passportPhotoPath={detail.applicants[i]?.passportPhotoPath ?? null}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">First Name *</Label>
                    <Input {...form.register(`applicants.${i}.firstName`)} className="h-8 text-sm" />
                    <FieldError message={errors.applicants?.[i]?.firstName?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Last Name *</Label>
                    <Input {...form.register(`applicants.${i}.lastName`)} className="h-8 text-sm" />
                    <FieldError message={errors.applicants?.[i]?.lastName?.message} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Nationality *</Label>
                    <Input {...form.register(`applicants.${i}.nationality`)} className="h-8 text-sm" />
                    <FieldError message={errors.applicants?.[i]?.nationality?.message} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="rounded-md border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Contact</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-xs text-muted-foreground">Name</dt><dd>{values.contactFullName || "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Phone</dt><dd>{values.contactPhone || "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Email</dt><dd>{values.contactEmail || "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Address</dt><dd>{values.contactAddress || "—"}</dd></div>
              </dl>
            </div>
            <div className="rounded-md border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Travel & Visa</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-xs text-muted-foreground">Entry</dt><dd>{values.entryDate || "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Exit</dt><dd>{values.exitDate || "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Visa Type</dt><dd>{visaTypeLabel}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Processing</dt><dd>{processingLabel}</dd></div>
              </dl>
            </div>
            <div className="rounded-md border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Applicants ({fields.length})
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {values.applicants.map((a, i) => (
                  <li key={i}>{a.firstName} {a.lastName} · {a.nationality || "—"}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <textarea
                {...form.register("notes")}
                placeholder="Optional notes…"
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t px-5 py-4">
        <Button type="button" variant="outline" size="sm" onClick={step === 0 ? onCancel : () => setStep(step - 1)}>
          {step === 0 ? "Cancel" : (<><ChevronLeft className="h-3.5 w-3.5" />Back</>)}
        </Button>
        <Button type="button" size="sm" disabled={mutation.isPending} onClick={handleNext}>
          {step === STEPS.length - 1
            ? mutation.isPending ? "Saving…" : "Save Changes"
            : (<>Next<ChevronRight className="h-3.5 w-3.5" /></>)}
        </Button>
      </div>
    </div>
  )
}
