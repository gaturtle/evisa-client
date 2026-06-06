import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteVisaProcessing } from "@/api/visa-processings"
import type { VisaProcessing } from "@/types/visa-processing"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteVisaProcessingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visaProcessing: VisaProcessing | null
}

export function DeleteVisaProcessingDialog({
  open,
  onOpenChange,
  visaProcessing,
}: DeleteVisaProcessingDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteVisaProcessing(visaProcessing!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-processings"] })
      toast.success("Processing option deleted.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to delete processing option.")
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Processing Option</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{visaProcessing?.description}</span>?
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
            disabled={mutation.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {mutation.isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
