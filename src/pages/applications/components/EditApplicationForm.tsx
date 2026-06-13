import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

import { updateApplication } from "@/api/applications"
import type { UpdateApplicationRequest, VisaApplicationDetail } from "@/types/application"
import type { VisaType } from "@/types/visa-type"
import type { VisaProcessing } from "@/types/visa-processing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApplicantPhotos } from "./ApplicantPhotos"

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

interface EditApplicationFormProps {
  id: string
  detail: VisaApplicationDetail
  visaTypes: VisaType[]
  visaProcessings: VisaProcessing[]
  onCancel: () => void
  onSuccess: () => void
}


const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
      {title}
    </h3>
  )
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "applicants",
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const request: UpdateApplicationRequest = {
        contactFullName: values.contactFullName,
        contactPhone: values.contactPhone,
        contactEmail: values.contactEmail,
        contactAddress: values.contactAddress,
        entryDate: `${values.entryDate}T00:00:00`,
        exitDate: `${values.exitDate}T00:00:00`,
        visaTypeId: values.visaTypeId,
        processingOptionId: values.processingOptionId,
        isUrgentProcessing: detail.isUrgentProcessing,
        isMultipleEntry: detail.isMultipleEntry,
        isAirportTransfer: detail.isAirportTransfer,
        isOther: detail.isOther,
        notes: values.notes || undefined,
        applicants: values.applicants,
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

  return (
    <div className="h-full overflow-y-auto">
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="border-b px-5 py-4">
          <SectionHeading title="Contact Information" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Full Name *</Label>
              <Input {...form.register("contactFullName")} className="h-8 text-sm" />
              <FieldError message={errors.contactFullName?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Phone *</Label>
              <Input {...form.register("contactPhone")} className="h-8 text-sm" />
              <FieldError message={errors.contactPhone?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Email *</Label>
              <Input type="email" {...form.register("contactEmail")} className="h-8 text-sm" />
              <FieldError message={errors.contactEmail?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Address *</Label>
              <Input {...form.register("contactAddress")} className="h-8 text-sm" />
              <FieldError message={errors.contactAddress?.message} />
            </div>
          </div>
        </div>

        <div className="border-b px-5 py-4">
          <SectionHeading title="Travel Details" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Entry Date *</Label>
              <Input type="date" {...form.register("entryDate")} className="h-8 text-sm" />
              <FieldError message={errors.entryDate?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Exit Date *</Label>
              <Input type="date" {...form.register("exitDate")} className="h-8 text-sm" />
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

        <div className="border-b px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionHeading title={`Applicants (${fields.length})`} />
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
          {errors.applicants?.root && (
            <FieldError message={errors.applicants.root.message} />
          )}
          <div className="flex flex-col gap-2">
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
                    <Input
                      {...form.register(`applicants.${i}.firstName`)}
                      className="h-8 text-sm"
                    />
                    <FieldError message={errors.applicants?.[i]?.firstName?.message} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Last Name *</Label>
                    <Input
                      {...form.register(`applicants.${i}.lastName`)}
                      className="h-8 text-sm"
                    />
                    <FieldError message={errors.applicants?.[i]?.lastName?.message} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b px-5 py-4">
          <SectionHeading title="Notes" />
          <textarea
            {...form.register("notes")}
            placeholder="Optional notes…"
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
