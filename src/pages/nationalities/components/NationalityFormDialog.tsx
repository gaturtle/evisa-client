import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createNationality, updateNationality } from "@/api/nationalities"
import type { VisaNationality } from "@/types/nationality"
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

const formSchema = z.object({
  origName: z.string().min(1, "English name is required"),
  vietnameseName: z.string().min(1, "Vietnamese name is required"),
  isEligible: z.boolean(),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origName: "",
      vietnameseName: "",
      isEligible: false,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        nationality
          ? {
              origName: nationality.origName,
              vietnameseName: nationality.vietnameseName,
              isEligible: nationality.isEligible,
            }
          : { origName: "", vietnameseName: "", isEligible: false }
      )
    }
  }, [open, nationality, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? updateNationality(nationality.id, values)
        : createNationality(values),
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
