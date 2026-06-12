import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteHoliday } from "@/api/holidays"
import type { Holiday } from "@/types/holiday"
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

interface DeleteHolidayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  holiday: Holiday | null
  year: number
}

export function DeleteHolidayDialog({
  open,
  onOpenChange,
  holiday,
  year,
}: DeleteHolidayDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteHoliday(holiday!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays", year] })
      toast.success("Holiday deleted.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to delete holiday.")
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{holiday?.name}</span>?
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
