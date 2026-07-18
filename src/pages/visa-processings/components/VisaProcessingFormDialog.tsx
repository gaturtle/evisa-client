import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createVisaProcessing, updateVisaProcessing } from "@/api/visa-processings"
import {
  getVisaProcessingExcludedGroups,
  setVisaProcessingExcludedGroups,
} from "@/api/visa-processing-exclusions"
import { getNationalityGroups } from "@/api/nationality-groups"
import type { VisaProcessing } from "@/types/visa-processing"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MultiCombobox } from "@/components/ui/multi-combobox"

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().nonnegative("Price must be 0 or greater"),
  minDays: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive("Min days must be a positive integer").nullable()
  ),
  maxDays: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive("Max days must be a positive integer").nullable()
  ),
  isEmergency: z.boolean(),
  excludedGroupIds: z.array(z.string()),
}).refine(
  (d) => d.minDays == null || d.maxDays == null || d.minDays <= d.maxDays,
  { message: "Min days must not exceed max days", path: ["maxDays"] }
)

type FormValues = z.infer<typeof formSchema>

const EMPTY_GROUP_IDS: string[] = []

interface VisaProcessingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visaProcessing?: VisaProcessing
}

export function VisaProcessingFormDialog({
  open,
  onOpenChange,
  visaProcessing,
}: VisaProcessingFormDialogProps) {
  const isEdit = !!visaProcessing
  const queryClient = useQueryClient()

  const { data: groups = [] } = useQuery({
    queryKey: ["nationality-groups"],
    queryFn: getNationalityGroups,
  })

  const { data: excludedGroupIds = EMPTY_GROUP_IDS } = useQuery({
    queryKey: ["visa-processing-excluded-groups", visaProcessing?.id],
    queryFn: () => getVisaProcessingExcludedGroups(visaProcessing!.id),
    enabled: isEdit && open,
  })

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues, unknown, FormValues>,
    defaultValues: { description: "", price: 0, isEmergency: false, excludedGroupIds: [] },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        description: visaProcessing?.description ?? "",
        price: visaProcessing?.price ?? 0,
        minDays: visaProcessing?.minDays ?? null,
        maxDays: visaProcessing?.maxDays ?? null,
        isEmergency: visaProcessing?.isEmergency ?? false,
        excludedGroupIds: isEdit ? excludedGroupIds : [],
      })
    }
  }, [open, visaProcessing, form, isEdit, excludedGroupIds])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { excludedGroupIds: groupIds, ...body } = values
      const saved = isEdit
        ? await updateVisaProcessing(visaProcessing.id, body)
        : await createVisaProcessing(body)
      await setVisaProcessingExcludedGroups(saved.id, groupIds, isEdit ? excludedGroupIds : [])
      return saved
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-processings"] })
      queryClient.invalidateQueries({ queryKey: ["visa-processing-excluded-groups", visaProcessing?.id] })
      toast.success(isEdit ? "Processing option updated." : "Processing option created.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error(isEdit ? "Failed to update processing option." : "Failed to create processing option.")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Processing Option" : "Add Processing Option"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Standard" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="e.g. 10.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 3"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 7"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isEmergency"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">Emergency processing</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excludedGroupIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excluded Groups <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <MultiCombobox
                      options={groups.map((g) => ({ value: g.id, label: g.name }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="No excluded groups"
                      searchPlaceholder="Search groups…"
                      emptyText="No groups found."
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Applicants whose nationality belongs to an excluded group cannot select this
                    processing option at all — there's no exception for this.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Processing Option"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
