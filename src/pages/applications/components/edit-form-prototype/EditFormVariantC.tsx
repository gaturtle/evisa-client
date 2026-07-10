// PROTOTYPE — throwaway. Variant C: dense inline spreadsheet.
// Trades whitespace and section chrome for density: contact + travel fields collapse into a
// tight label-above-input grid, applicants become an editable table instead of stacked cards,
// and a sticky footer shows a live changed-field count. Answers: for a reviewer doing quick
// corrections all day, does a spreadsheet-like layout beat the sectioned-card form?
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Image, Plus, Trash2 } from "lucide-react"

import { updateApplication } from "@/api/applications"
import type { UpdateApplicationRequest, VisaApplicationDetail } from "@/types/application"
import type { VisaType } from "@/types/visa-type"
import type { VisaProcessing } from "@/types/visa-processing"
import { Button } from "@/components/ui/button"

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

const cellInput =
  "h-7 w-full rounded border-0 border-b border-transparent bg-transparent px-1 text-xs text-foreground hover:border-input focus:border-ring focus:outline-none focus:ring-0"
const fieldInput =
  "h-7 w-full rounded border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
const selectClass = fieldInput

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[10px] leading-tight text-destructive">{message}</p>
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="border-b px-1.5 py-1 align-top">{children}</td>
}

export function EditFormVariantC({ id, detail, visaTypes, visaProcessings, onCancel, onSuccess }: Props) {
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

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "applicants" })
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

  return (
    <div className="flex h-full flex-col">
      <form
        onSubmit={form.handleSubmit((vals) => mutation.mutate(vals))}
        className="flex flex-1 flex-col overflow-y-auto"
      >
        <div className="flex-1 px-4 py-3">
          <div className="grid grid-cols-4 gap-x-3 gap-y-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium text-muted-foreground">Full Name *</label>
              <input {...form.register("contactFullName")} className={fieldInput} />
              <FieldError message={errors.contactFullName?.message} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium text-muted-foreground">Phone *</label>
              <input {...form.register("contactPhone")} className={fieldInput} />
              <FieldError message={errors.contactPhone?.message} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium text-muted-foreground">Email *</label>
              <input type="email" {...form.register("contactEmail")} className={fieldInput} />
              <FieldError message={errors.contactEmail?.message} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium text-muted-foreground">Address *</label>
              <input {...form.register("contactAddress")} className={fieldInput} />
              <FieldError message={errors.contactAddress?.message} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium text-muted-foreground">Entry Date *</label>
              <input type="date" {...form.register("entryDate")} className={fieldInput} />
              <FieldError message={errors.entryDate?.message} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium text-muted-foreground">Exit Date *</label>
              <input type="date" {...form.register("exitDate")} className={fieldInput} />
              <FieldError message={errors.exitDate?.message} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium text-muted-foreground">Visa Type *</label>
              <select {...form.register("visaTypeId")} className={selectClass}>
                <option value="">Select…</option>
                {visaTypes.map((v) => (
                  <option key={v.id} value={v.id}>{v.description}</option>
                ))}
              </select>
              <FieldError message={errors.visaTypeId?.message} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium text-muted-foreground">Processing *</label>
              <select {...form.register("processingOptionId")} className={selectClass}>
                <option value="">Select…</option>
                {visaProcessings.map((p) => (
                  <option key={p.id} value={p.id}>{p.description}</option>
                ))}
              </select>
              <FieldError message={errors.processingOptionId?.message} />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              Applicants ({fields.length})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="gap-1"
              onClick={() => append({ firstName: "", lastName: "", nationality: "" })}
            >
              <Plus className="h-3 w-3" />
              Add row
            </Button>
          </div>
          {errors.applicants?.root && <FieldError message={errors.applicants.root.message} />}

          <table className="mt-1 w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-[10px] font-medium text-muted-foreground/70">
                <th className="w-6 border-b px-1.5 py-1 font-medium">#</th>
                <th className="border-b px-1.5 py-1 font-medium">First Name</th>
                <th className="border-b px-1.5 py-1 font-medium">Last Name</th>
                <th className="border-b px-1.5 py-1 font-medium">Nationality</th>
                <th className="w-16 border-b px-1.5 py-1 font-medium">Photos</th>
                <th className="w-6 border-b px-1.5 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => {
                const src = detail.applicants[i]
                return (
                  <tr key={field.id} className="hover:bg-muted/40">
                    <Cell>
                      <span className="text-muted-foreground/60">{i + 1}</span>
                    </Cell>
                    <Cell>
                      <input {...form.register(`applicants.${i}.firstName`)} className={cellInput} />
                      <FieldError message={errors.applicants?.[i]?.firstName?.message} />
                    </Cell>
                    <Cell>
                      <input {...form.register(`applicants.${i}.lastName`)} className={cellInput} />
                      <FieldError message={errors.applicants?.[i]?.lastName?.message} />
                    </Cell>
                    <Cell>
                      <input {...form.register(`applicants.${i}.nationality`)} className={cellInput} />
                      <FieldError message={errors.applicants?.[i]?.nationality?.message} />
                    </Cell>
                    <Cell>
                      <div className="flex items-center gap-1.5" title="Portrait / Passport photo status">
                        <Image className={`h-3.5 w-3.5 ${src?.portraitPhotoPath ? "text-green-600" : "text-muted-foreground/30"}`} />
                        <Image className={`h-3.5 w-3.5 ${src?.passportPhotoPath ? "text-green-600" : "text-muted-foreground/30"}`} />
                      </div>
                    </Cell>
                    <Cell>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </Cell>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="mt-3 flex flex-col gap-0.5">
            <label className="text-[10px] font-medium text-muted-foreground">Notes</label>
            <textarea
              {...form.register("notes")}
              placeholder="Optional notes…"
              rows={2}
              className="w-full resize-none rounded border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-4 py-2.5">
          <span className="text-[10px] text-muted-foreground">
            {dirtyCount > 0 ? `${dirtyCount} field${dirtyCount !== 1 ? "s" : ""} changed` : "No changes"}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="xs" onClick={onCancel}>Cancel</Button>
            <Button type="submit" size="xs" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
