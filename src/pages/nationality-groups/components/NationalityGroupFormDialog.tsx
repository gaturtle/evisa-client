import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createNationalityGroup, updateNationalityGroup } from "@/api/nationality-groups"
import type { NationalityGroup } from "@/types/nationality-group"
import { Button } from "@/components/ui/button"
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
  name: z.string().min(1, "Name is required"),
})

type FormValues = z.infer<typeof formSchema>

interface NationalityGroupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: NationalityGroup
}

export function NationalityGroupFormDialog({
  open,
  onOpenChange,
  group,
}: NationalityGroupFormDialogProps) {
  const isEdit = !!group
  const queryClient = useQueryClient()

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues, unknown, FormValues>,
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({ name: group?.name ?? "" })
    }
  }, [open, group, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? updateNationalityGroup(group.id, values)
        : createNationalityGroup(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nationality-groups"] })
      toast.success(isEdit ? "Nationality group updated." : "Nationality group created.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error(isEdit ? "Failed to update nationality group." : "Failed to create nationality group.")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Nationality Group" : "Add Nationality Group"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. High Risk" {...field} />
                  </FormControl>
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
                {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
