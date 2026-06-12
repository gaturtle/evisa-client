import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createVisaType, updateVisaType } from "@/api/visa-types"
import type { VisaType } from "@/types/visa-type"
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
  price: z.coerce.number().positive("Price must be a positive number"),
})

type FormValues = z.infer<typeof formSchema>

interface VisaTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visaType?: VisaType
}

export function VisaTypeFormDialog({
  open,
  onOpenChange,
  visaType,
}: VisaTypeFormDialogProps) {
  const isEdit = !!visaType
  const queryClient = useQueryClient()

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues, unknown, FormValues>,
    defaultValues: { description: "", price: 0 },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        description: visaType?.description ?? "",
        price: visaType?.price ?? 0,
      })
    }
  }, [open, visaType, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? updateVisaType(visaType.id, values)
        : createVisaType(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-types"] })
      toast.success(isEdit ? "Visa type updated." : "Visa type created.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error(isEdit ? "Failed to update visa type." : "Failed to create visa type.")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Visa Type" : "Add Visa Type"}</DialogTitle>
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
                    <Input placeholder="e.g. Single Entry" {...field} />
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
                    <Input type="number" step="0.01" min="0" placeholder="e.g. 25.00" {...field} />
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
                {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Visa Type"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
