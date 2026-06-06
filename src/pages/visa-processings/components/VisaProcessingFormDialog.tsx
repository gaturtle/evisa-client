import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createVisaProcessing, updateVisaProcessing } from "@/api/visa-processings"
import type { VisaProcessing } from "@/types/visa-processing"
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
  description: z.string().min(1, "Description is required"),
})

type FormValues = z.infer<typeof formSchema>

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({ description: visaProcessing?.description ?? "" })
    }
  }, [open, visaProcessing, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? updateVisaProcessing(visaProcessing.id, values)
        : createVisaProcessing(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-processings"] })
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
