import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteVisaType } from "@/api/visa-types"
import type { VisaType } from "@/types/visa-type"
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

interface DeleteVisaTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visaType: VisaType | null
}

export function DeleteVisaTypeDialog({
  open,
  onOpenChange,
  visaType,
}: DeleteVisaTypeDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteVisaType(visaType!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-types"] })
      toast.success("Visa type deleted.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to delete visa type.")
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Visa Type</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{visaType?.description}</span>?
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
