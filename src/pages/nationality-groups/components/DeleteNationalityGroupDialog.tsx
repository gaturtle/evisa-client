import axios from "axios"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteNationalityGroup } from "@/api/nationality-groups"
import type { NationalityGroup } from "@/types/nationality-group"
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

interface DeleteNationalityGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: NationalityGroup | null
}

export function DeleteNationalityGroupDialog({
  open,
  onOpenChange,
  group,
}: DeleteNationalityGroupDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteNationalityGroup(group!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nationality-groups"] })
      toast.success("Nationality group deleted.")
      onOpenChange(false)
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error(
          error.response.data?.message ??
            "This group still has member nationalities or is referenced by a visa type/processing rule."
        )
      } else {
        toast.error("Failed to delete nationality group.")
      }
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Nationality Group</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{group?.name}</span>?
            This cannot be undone. The group must have no member nationalities and no
            visa type/processing rules referencing it.
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
