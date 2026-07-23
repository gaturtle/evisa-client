import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import type { UseFormSetError } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

import { updateApplication } from "@/api/applications"
import { getNationalities } from "@/api/nationalities"
import type { UpdateApplicationRequest, VisaApplicationDetail } from "@/types/application"
import type { VisaNationality } from "@/types/nationality"
import type { VisaType } from "@/types/visa-type"
import type { VisaProcessing } from "@/types/visa-processing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApplicantPhotos } from "./ApplicantPhotos"

function requiresCompanyInfo(purposeOfTravel: string) {
  const p = purposeOfTravel.trim().toLowerCase()
  return p === "business" || p === "working"
}

function requiresExtraDetails(applicantNationalityIds: string[], nationalities: VisaNationality[]) {
  return applicantNationalityIds.some(
    (id) => nationalities.find((n) => n.id === id)?.requiresExtraDetails
  )
}

const applicantSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  nationalityId: z.string().min(1, "Required"),
  religion: z.string().optional(),
  phoneInCountry: z.string().optional(),
  usedOtherPassport: z.string().optional(),
  otherPassportNumber: z.string().optional(),
  violatedLaws: z.string().optional(),
  violationDetails: z.string().optional(),
})

const formSchema = z.object({
  contactFullName: z.string().min(1, "Required"),
  contactPhone: z.string().min(1, "Required"),
  contactEmail: z.string().email("Invalid email"),
  contactAddress: z.string().min(1, "Required"),
  companyName: z.string().optional(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  entryDate: z.string().min(1, "Required"),
  exitDate: z.string().min(1, "Required"),
  visaTypeId: z.string().min(1, "Required"),
  processingOptionId: z.string().min(1, "Required"),
  notes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactAddress: z.string().optional(),
  occupationCompanyName: z.string().optional(),
  occupationJobTitle: z.string().optional(),
  occupationCompanyPhone: z.string().optional(),
  occupationCompanyAddress: z.string().optional(),
  vnStayAddress: z.string().optional(),
  vnStayPhone: z.string().optional(),
  vnVisitedLastYear: z.string().optional(),
  vnVisitDetails: z.string().optional(),
  vnHasRelatives: z.string().optional(),
  vnRelativeDetails: z.string().optional(),
  applicants: z.array(applicantSchema).min(1, "At least one applicant is required"),
})

type FormValues = z.infer<typeof formSchema>

function requireField(
  setError: UseFormSetError<FormValues>,
  path: Parameters<UseFormSetError<FormValues>>[0],
  value: string | undefined
) {
  if (value && value.trim()) return true
  setError(path, { message: "Required" })
  return false
}

function validateCompanyStep(vals: FormValues, requiresCompany: boolean, setError: UseFormSetError<FormValues>) {
  if (!requiresCompany) return true
  const a = requireField(setError, "companyName", vals.companyName)
  const b = requireField(setError, "companyPhone", vals.companyPhone)
  const c = requireField(setError, "companyAddress", vals.companyAddress)
  return a && b && c
}

function validateApplicantsStep(vals: FormValues, requiresExtra: boolean, setError: UseFormSetError<FormValues>) {
  if (!requiresExtra) return true
  let ok = true
  ok = requireField(setError, "emergencyContactName", vals.emergencyContactName) && ok
  ok = requireField(setError, "emergencyContactPhone", vals.emergencyContactPhone) && ok
  ok = requireField(setError, "emergencyContactRelationship", vals.emergencyContactRelationship) && ok
  ok = requireField(setError, "emergencyContactAddress", vals.emergencyContactAddress) && ok
  ok = requireField(setError, "occupationCompanyName", vals.occupationCompanyName) && ok
  ok = requireField(setError, "occupationJobTitle", vals.occupationJobTitle) && ok
  ok = requireField(setError, "occupationCompanyPhone", vals.occupationCompanyPhone) && ok
  ok = requireField(setError, "occupationCompanyAddress", vals.occupationCompanyAddress) && ok
  ok = requireField(setError, "vnStayAddress", vals.vnStayAddress) && ok
  ok = requireField(setError, "vnStayPhone", vals.vnStayPhone) && ok
  ok = requireField(setError, "vnVisitedLastYear", vals.vnVisitedLastYear) && ok
  ok = requireField(setError, "vnHasRelatives", vals.vnHasRelatives) && ok
  if (vals.vnVisitedLastYear === "yes") {
    ok = requireField(setError, "vnVisitDetails", vals.vnVisitDetails) && ok
  }
  vals.applicants.forEach((a, i) => {
    ok = requireField(setError, `applicants.${i}.religion`, a.religion) && ok
    ok = requireField(setError, `applicants.${i}.phoneInCountry`, a.phoneInCountry) && ok
    ok = requireField(setError, `applicants.${i}.usedOtherPassport`, a.usedOtherPassport) && ok
    ok = requireField(setError, `applicants.${i}.violatedLaws`, a.violatedLaws) && ok
    if (a.usedOtherPassport === "yes") {
      ok = requireField(setError, `applicants.${i}.otherPassportNumber`, a.otherPassportNumber) && ok
    }
  })
  return ok
}

interface EditApplicationFormProps {
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

export function EditApplicationForm({
  id,
  detail,
  visaTypes,
  visaProcessings,
  onCancel,
  onSuccess,
}: EditApplicationFormProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [maxVisited, setMaxVisited] = useState(0)

  const { data: nationalities = [] } = useQuery({
    queryKey: ["nationalities"],
    queryFn: getNationalities,
  })

  const companyRequired = requiresCompanyInfo(detail.purposeOfTravel)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactFullName: detail.contactFullName,
      contactPhone: detail.contactPhone,
      contactEmail: detail.contactEmail,
      contactAddress: detail.contactAddress,
      companyName: detail.companyName ?? "",
      companyPhone: detail.companyPhone ?? "",
      companyAddress: detail.companyAddress ?? "",
      entryDate: detail.entryDate?.slice(0, 10) ?? "",
      exitDate: detail.exitDate?.slice(0, 10) ?? "",
      visaTypeId: detail.visaTypeId,
      processingOptionId: detail.processingOptionId,
      notes: detail.notes ?? "",
      emergencyContactName: detail.emergencyContactName ?? "",
      emergencyContactPhone: detail.emergencyContactPhone ?? "",
      emergencyContactRelationship: detail.emergencyContactRelationship ?? "",
      emergencyContactAddress: detail.emergencyContactAddress ?? "",
      occupationCompanyName: detail.occupationCompanyName ?? "",
      occupationJobTitle: detail.occupationJobTitle ?? "",
      occupationCompanyPhone: detail.occupationCompanyPhone ?? "",
      occupationCompanyAddress: detail.occupationCompanyAddress ?? "",
      vnStayAddress: detail.vnStayAddress ?? "",
      vnStayPhone: detail.vnStayPhone ?? "",
      vnVisitedLastYear: detail.vnVisitedLastYear ?? "",
      vnVisitDetails: detail.vnVisitDetails ?? "",
      vnHasRelatives: detail.vnHasRelatives ?? "",
      vnRelativeDetails: detail.vnRelativeDetails ?? "",
      applicants: detail.applicants.map((a) => ({
        firstName: a.firstName,
        lastName: a.lastName,
        nationalityId: a.nationalityId ?? "",
        religion: a.religion ?? "",
        phoneInCountry: a.phoneInCountry ?? "",
        usedOtherPassport: a.usedOtherPassport ?? "",
        otherPassportNumber: a.otherPassportNumber ?? "",
        violatedLaws: a.violatedLaws ?? "",
        violationDetails: a.violationDetails ?? "",
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "applicants" })
  const values = form.watch()

  const extraDetailsRequired = requiresExtraDetails(
    values.applicants.map((a) => a.nationalityId),
    nationalities
  )

  const mutation = useMutation({
    mutationFn: (vals: FormValues) => {
      const extra = requiresExtraDetails(vals.applicants.map((a) => a.nationalityId), nationalities)
      const request: UpdateApplicationRequest = {
        contactFullName: vals.contactFullName,
        contactPhone: vals.contactPhone,
        contactEmail: vals.contactEmail,
        contactAddress: vals.contactAddress,
        companyName: companyRequired ? vals.companyName : undefined,
        companyPhone: companyRequired ? vals.companyPhone : undefined,
        companyAddress: companyRequired ? vals.companyAddress : undefined,
        entryDate: `${vals.entryDate}T00:00:00`,
        exitDate: `${vals.exitDate}T00:00:00`,
        visaTypeId: vals.visaTypeId,
        processingOptionId: vals.processingOptionId,
        isUrgentProcessing: detail.isUrgentProcessing,
        isMultipleEntry: detail.isMultipleEntry,
        isAirportTransfer: detail.isAirportTransfer,
        isOther: detail.isOther,
        notes: vals.notes || undefined,
        emergencyContactName: extra ? vals.emergencyContactName : undefined,
        emergencyContactPhone: extra ? vals.emergencyContactPhone : undefined,
        emergencyContactRelationship: extra ? vals.emergencyContactRelationship : undefined,
        emergencyContactAddress: extra ? vals.emergencyContactAddress : undefined,
        occupationCompanyName: extra ? vals.occupationCompanyName : undefined,
        occupationJobTitle: extra ? vals.occupationJobTitle : undefined,
        occupationCompanyPhone: extra ? vals.occupationCompanyPhone : undefined,
        occupationCompanyAddress: extra ? vals.occupationCompanyAddress : undefined,
        vnStayAddress: extra ? vals.vnStayAddress : undefined,
        vnStayPhone: extra ? vals.vnStayPhone : undefined,
        vnVisitedLastYear: extra ? vals.vnVisitedLastYear : undefined,
        vnVisitDetails: extra ? vals.vnVisitDetails : undefined,
        vnHasRelatives: extra ? vals.vnHasRelatives : undefined,
        vnRelativeDetails: extra ? vals.vnRelativeDetails : undefined,
        applicants: vals.applicants.map((a) => ({
          firstName: a.firstName,
          lastName: a.lastName,
          nationalityId: a.nationalityId,
          religion: extra ? a.religion : undefined,
          phoneInCountry: extra ? a.phoneInCountry : undefined,
          usedOtherPassport: extra ? a.usedOtherPassport : undefined,
          otherPassportNumber: extra ? a.otherPassportNumber : undefined,
          violatedLaws: extra ? a.violatedLaws : undefined,
          violationDetails: extra ? a.violationDetails : undefined,
        })),
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
      if (step === 0 && !validateCompanyStep(form.getValues(), companyRequired, form.setError)) return
      if (step === 2 && !validateApplicantsStep(form.getValues(), extraDetailsRequired, form.setError)) return
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
            {companyRequired && (
              <div className="mt-2 flex flex-col gap-4 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Company (Business/Working)
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Company Name *</Label>
                  <Input {...form.register("companyName")} />
                  <FieldError message={errors.companyName?.message} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Company Phone *</Label>
                  <Input {...form.register("companyPhone")} />
                  <FieldError message={errors.companyPhone?.message} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Company Address *</Label>
                  <Input {...form.register("companyAddress")} />
                  <FieldError message={errors.companyAddress?.message} />
                </div>
              </div>
            )}
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
          <div className="flex flex-col gap-5">
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
                  onClick={() =>
                    append({
                      firstName: "",
                      lastName: "",
                      nationalityId: "",
                      religion: "",
                      phoneInCountry: "",
                      usedOtherPassport: "",
                      otherPassportNumber: "",
                      violatedLaws: "",
                      violationDetails: "",
                    })
                  }
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
                      <select {...form.register(`applicants.${i}.nationalityId`)} className={`${selectClass} h-8`}>
                        <option value="">Select nationality…</option>
                        {nationalities.map((n) => (
                          <option key={n.id} value={n.id}>{n.origName}</option>
                        ))}
                      </select>
                      <FieldError message={errors.applicants?.[i]?.nationalityId?.message} />
                    </div>
                  </div>
                  {extraDetailsRequired && (
                    <div className="col-span-2 mt-3 flex flex-col gap-3 border-t pt-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Religion *</Label>
                        <Input {...form.register(`applicants.${i}.religion`)} className="h-8 text-sm" />
                        <FieldError message={errors.applicants?.[i]?.religion?.message} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Phone in Home Country *</Label>
                        <Input {...form.register(`applicants.${i}.phoneInCountry`)} className="h-8 text-sm" />
                        <FieldError message={errors.applicants?.[i]?.phoneInCountry?.message} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Used Other Passport? *</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-sm">
                            <input type="radio" value="yes" {...form.register(`applicants.${i}.usedOtherPassport`)} />
                            Yes
                          </label>
                          <label className="flex items-center gap-1.5 text-sm">
                            <input type="radio" value="no" {...form.register(`applicants.${i}.usedOtherPassport`)} />
                            No
                          </label>
                        </div>
                        <FieldError message={errors.applicants?.[i]?.usedOtherPassport?.message} />
                      </div>
                      {values.applicants[i]?.usedOtherPassport === "yes" && (
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-muted-foreground">Other Passport Number *</Label>
                          <Input {...form.register(`applicants.${i}.otherPassportNumber`)} className="h-8 text-sm" />
                          <FieldError message={errors.applicants?.[i]?.otherPassportNumber?.message} />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Violated Vietnamese Laws? *</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-sm">
                            <input type="radio" value="yes" {...form.register(`applicants.${i}.violatedLaws`)} />
                            Yes
                          </label>
                          <label className="flex items-center gap-1.5 text-sm">
                            <input type="radio" value="no" {...form.register(`applicants.${i}.violatedLaws`)} />
                            No
                          </label>
                        </div>
                        <FieldError message={errors.applicants?.[i]?.violatedLaws?.message} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Violation Details</Label>
                        <Input {...form.register(`applicants.${i}.violationDetails`)} className="h-8 text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {extraDetailsRequired && (
              <div className="flex flex-col gap-4 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Occupation
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Employer Name *</Label>
                    <Input {...form.register("occupationCompanyName")} className="h-8 text-sm" />
                    <FieldError message={errors.occupationCompanyName?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Job Title *</Label>
                    <Input {...form.register("occupationJobTitle")} className="h-8 text-sm" />
                    <FieldError message={errors.occupationJobTitle?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Employer Phone *</Label>
                    <Input {...form.register("occupationCompanyPhone")} className="h-8 text-sm" />
                    <FieldError message={errors.occupationCompanyPhone?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Employer Address *</Label>
                    <Input {...form.register("occupationCompanyAddress")} className="h-8 text-sm" />
                    <FieldError message={errors.occupationCompanyAddress?.message} />
                  </div>
                </div>

                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Emergency Contact
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Full Name *</Label>
                    <Input {...form.register("emergencyContactName")} className="h-8 text-sm" />
                    <FieldError message={errors.emergencyContactName?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Phone *</Label>
                    <Input {...form.register("emergencyContactPhone")} className="h-8 text-sm" />
                    <FieldError message={errors.emergencyContactPhone?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Relationship *</Label>
                    <Input {...form.register("emergencyContactRelationship")} className="h-8 text-sm" />
                    <FieldError message={errors.emergencyContactRelationship?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Address *</Label>
                    <Input {...form.register("emergencyContactAddress")} className="h-8 text-sm" />
                    <FieldError message={errors.emergencyContactAddress?.message} />
                  </div>
                </div>

                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                  Vietnam History
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Stay Address *</Label>
                    <Input {...form.register("vnStayAddress")} className="h-8 text-sm" />
                    <FieldError message={errors.vnStayAddress?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Stay Phone *</Label>
                    <Input {...form.register("vnStayPhone")} className="h-8 text-sm" />
                    <FieldError message={errors.vnStayPhone?.message} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Visited Vietnam Last Year? *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" value="yes" {...form.register("vnVisitedLastYear")} />
                        Yes
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" value="no" {...form.register("vnVisitedLastYear")} />
                        No
                      </label>
                    </div>
                    <FieldError message={errors.vnVisitedLastYear?.message} />
                  </div>
                  {values.vnVisitedLastYear === "yes" && (
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Visit Details *</Label>
                      <Input {...form.register("vnVisitDetails")} className="h-8 text-sm" />
                      <FieldError message={errors.vnVisitDetails?.message} />
                    </div>
                  )}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Has Relatives in Vietnam? *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" value="yes" {...form.register("vnHasRelatives")} />
                        Yes
                      </label>
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" value="no" {...form.register("vnHasRelatives")} />
                        No
                      </label>
                    </div>
                    <FieldError message={errors.vnHasRelatives?.message} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Relative Details</Label>
                    <Input {...form.register("vnRelativeDetails")} className="h-8 text-sm" />
                  </div>
                </div>
              </div>
            )}
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
            {companyRequired && (
              <div className="rounded-md border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Company</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Name</dt><dd>{values.companyName || "—"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Phone</dt><dd>{values.companyPhone || "—"}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-muted-foreground">Address</dt><dd>{values.companyAddress || "—"}</dd></div>
                </dl>
              </div>
            )}
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
                {values.applicants.map((a, i) => {
                  const nationalityName = nationalities.find((n) => n.id === a.nationalityId)?.origName
                  return (
                    <li key={i}>{a.firstName} {a.lastName} · {nationalityName || "—"}</li>
                  )
                })}
              </ul>
            </div>
            {extraDetailsRequired && (
              <p className="text-xs italic text-muted-foreground">
                Occupation, emergency contact, and Vietnam-history details have been recorded for applicants whose
                nationality requires them.
              </p>
            )}
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
