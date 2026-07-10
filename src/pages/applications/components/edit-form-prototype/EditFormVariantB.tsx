// PROTOTYPE — throwaway. Variant B: full-screen split inspector.
// Breaks out of the narrow drawer entirely (own portal, fixed inset-0) into a full-screen
// editor: a sticky left rail with identity + section jump-nav + a live dirty-field counter,
// and a wide scrolling right pane. Answers: does editing feel less cramped, and does jump-nav
// help orient on a form with this many fields, when it isn't squeezed into a 36rem drawer?
import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ChevronDown, Plus, Trash2 } from "lucide-react"

import { updateApplication } from "@/api/applications"
import type { UpdateApplicationRequest, VisaApplicationDetail } from "@/types/application"
import type { VisaType } from "@/types/visa-type"
import type { VisaProcessing } from "@/types/visa-processing"
import { Badge } from "@/components/ui/badge"
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

const SECTIONS = [
  { key: "contact", label: "Contact" },
  { key: "travel", label: "Travel & Visa" },
  { key: "applicants", label: "Applicants" },
  { key: "notes", label: "Notes" },
] as const

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")
}

export function EditFormVariantB({ id, detail, visaTypes, visaProcessings, onCancel, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<string>("contact")
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true })
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
  const applicantValues = form.watch("applicants")
  const dirtyCount = Object.keys(form.formState.dirtyFields).length

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

  function jumpTo(key: string) {
    setActiveSection(key)
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function onScroll() {
    const container = scrollContainerRef.current
    if (!container) return
    const containerTop = container.getBoundingClientRect().top
    let closest: (typeof SECTIONS)[number]["key"] = SECTIONS[0].key
    let closestDist = Infinity
    for (const s of SECTIONS) {
      const el = sectionRefs.current[s.key]
      if (!el) continue
      const dist = Math.abs(el.getBoundingClientRect().top - containerTop)
      if (dist < closestDist) {
        closestDist = dist
        closest = s.key
      }
    }
    setActiveSection(closest)
  }

  return createPortal(
    <div className="fixed inset-0 z-60 flex flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Edit Application</span>
          <span className="text-xs text-muted-foreground">{detail.referenceNumber}</span>
          {dirtyCount > 0 && (
            <Badge variant="secondary" className="ml-1">{dirtyCount} field{dirtyCount !== 1 ? "s" : ""} changed</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            type="button"
            size="sm"
            disabled={mutation.isPending}
            onClick={form.handleSubmit((vals) => mutation.mutate(vals))}
          >
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials(detail.contactFullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{detail.contactFullName}</p>
              <p className="truncate text-xs text-muted-foreground">{detail.contactEmail}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => jumpTo(s.key)}
                className={`rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  activeSection === s.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s.label}
                {s.key === "applicants" && ` (${fields.length})`}
              </button>
            ))}
          </nav>
        </div>

        <div ref={scrollContainerRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-10 px-8 py-8">
            <div ref={(el) => { sectionRefs.current.contact = el }}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Contact</h3>
              <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div ref={(el) => { sectionRefs.current.travel = el }}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Travel & Visa</h3>
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
            </div>

            <div ref={(el) => { sectionRefs.current.applicants = el }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Applicants ({fields.length})</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => {
                    append({ firstName: "", lastName: "", nationality: "" })
                    setExpanded((e) => ({ ...e, [fields.length]: true }))
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              {errors.applicants?.root && <FieldError message={errors.applicants.root.message} />}
              <div className="flex flex-col gap-2">
                {fields.map((field, i) => {
                  const isOpen = expanded[i] ?? false
                  const a = applicantValues[i]
                  return (
                    <div key={field.id} className="rounded-md border">
                      <button
                        type="button"
                        onClick={() => setExpanded((e) => ({ ...e, [i]: !isOpen }))}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                      >
                        <span className="text-sm">
                          <span className="mr-2 text-xs text-muted-foreground/60">{i + 1}</span>
                          {a?.firstName || a?.lastName ? `${a.firstName} ${a.lastName}`.trim() : "New applicant"}
                          {a?.nationality && <span className="text-muted-foreground"> · {a.nationality}</span>}
                        </span>
                        <div className="flex items-center gap-1">
                          {fields.length > 1 && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); remove(i) }}
                              className="rounded p-1 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t px-3 py-3">
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
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div ref={(el) => { sectionRefs.current.notes = el }} className="pb-8">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Notes</h3>
              <textarea
                {...form.register("notes")}
                placeholder="Optional notes…"
                rows={4}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
