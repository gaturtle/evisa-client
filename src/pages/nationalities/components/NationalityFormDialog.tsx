import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createNationality, updateNationality } from "@/api/nationalities"
import { getNationalityGroups } from "@/api/nationality-groups"
import type { VisaNationality } from "@/types/nationality"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
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

const formSchema = z.object({
  origName: z.string().min(1, "English name is required"),
  vietnameseName: z.string().min(1, "Vietnamese name is required"),
  isEligible: z.boolean(),
  exemptionDays: z.coerce
    .number()
    .int()
    .min(1, "Must be at least 1 day")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  groupId: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface NationalityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nationality?: VisaNationality
}

export function NationalityFormDialog({
  open,
  onOpenChange,
  nationality,
}: NationalityFormDialogProps) {
  const isEdit = !!nationality
  const queryClient = useQueryClient()

  const { data: groups = [] } = useQuery({
    queryKey: ["nationality-groups"],
    queryFn: getNationalityGroups,
  })

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues, unknown, FormValues>,
    defaultValues: {
      origName: "",
      vietnameseName: "",
      isEligible: false,
      exemptionDays: undefined,
      groupId: "",
    },
  })

  const isEligible = form.watch("isEligible")

  useEffect(() => {
    if (open) {
      form.reset(
        nationality
          ? {
              origName: nationality.origName,
              vietnameseName: nationality.vietnameseName,
              isEligible: nationality.isEligible,
              exemptionDays: nationality.exemptionDays ?? undefined,
              groupId: nationality.groupId ?? "",
            }
          : { origName: "", vietnameseName: "", isEligible: false, exemptionDays: undefined, groupId: "" }
      )
    }
  }, [open, nationality, form])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        origName: values.origName,
        vietnameseName: values.vietnameseName,
        isEligible: values.isEligible,
        exemptionDays: values.isEligible ? values.exemptionDays : undefined,
        groupId: values.groupId || undefined,
      }
      return isEdit
        ? updateNationality(nationality.id, body)
        : createNationality(body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nationalities"] })
      toast.success(isEdit ? "Nationality updated." : "Nationality created.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error(isEdit ? "Failed to update nationality." : "Failed to create nationality.")
    },
  })

  function onSubmit(values: FormValues) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Nationality" : "Add Nationality"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="origName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>English Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Vietnamese" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vietnameseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vietnamese Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Việt Nam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isEligible"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Eligible for e-visa</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Combobox
                      options={groups.map((g) => ({ value: g.id, label: g.name }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="None"
                      searchPlaceholder="Search groups…"
                      emptyText="No groups found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEligible && (
              <FormField
                control={form.control}
                name="exemptionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exemption Days <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 90"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Nationality"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
