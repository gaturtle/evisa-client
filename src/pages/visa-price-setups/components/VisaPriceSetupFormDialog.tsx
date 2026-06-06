import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createVisaPriceSetup, updateVisaPriceSetup } from "@/api/visa-price-setups"
import { getVisaTypes } from "@/api/visa-types"
import { getVisaProcessings } from "@/api/visa-processings"
import type { VisaPriceSetup } from "@/types/visa-price-setup"
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
  visaTypeId: z.string().min(1, "Visa type is required"),
  visaProcessingId: z.string().min(1, "Processing is required"),
  price: z.coerce.number({ invalid_type_error: "Price must be a number" }).positive("Price must be greater than 0"),
})

type FormValues = z.infer<typeof formSchema>

interface VisaPriceSetupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  priceSetup?: VisaPriceSetup
}

export function VisaPriceSetupFormDialog({
  open,
  onOpenChange,
  priceSetup,
}: VisaPriceSetupFormDialogProps) {
  const isEdit = !!priceSetup
  const queryClient = useQueryClient()

  const { data: visaTypes = [] } = useQuery({
    queryKey: ["visa-types"],
    queryFn: getVisaTypes,
    enabled: open,
  })

  const { data: visaProcessings = [] } = useQuery({
    queryKey: ["visa-processings"],
    queryFn: getVisaProcessings,
    enabled: open,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { visaTypeId: "", visaProcessingId: "", price: 0 },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        visaTypeId: priceSetup?.visaTypeId ?? "",
        visaProcessingId: priceSetup?.visaProcessingId ?? "",
        price: priceSetup?.price ?? 0,
      })
    }
  }, [open, priceSetup, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? updateVisaPriceSetup(priceSetup.id, values)
        : createVisaPriceSetup(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-price-setups"] })
      toast.success(isEdit ? "Price setup updated." : "Price setup created.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error(isEdit ? "Failed to update price setup." : "Failed to create price setup.")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Price Setup" : "Add Price Setup"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="visaTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visa Type</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a visa type…</option>
                      {visaTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.description}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visaProcessingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processing</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a processing option…</option>
                      {visaProcessings.map((p) => (
                        <option key={p.id} value={p.id}>{p.description}</option>
                      ))}
                    </select>
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
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 25.00"
                      {...field}
                    />
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
                {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Price Setup"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
