import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteVisaPriceSetup } from "@/api/visa-price-setups"
import type { VisaPriceSetup } from "@/types/visa-price-setup"
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

interface DeleteVisaPriceSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  priceSetup: VisaPriceSetup | null
}

function priceSetupLabel(priceSetup: VisaPriceSetup | null): string {
  if (!priceSetup) return ""
  const type = priceSetup.visaType?.description ?? priceSetup.visaTypeId
  const processing = priceSetup.visaProcessing?.description ?? priceSetup.visaProcessingId
  return `${type} — ${processing}`
}

export function DeleteVisaPriceSetupDialog({
  open,
  onOpenChange,
  priceSetup,
}: DeleteVisaPriceSetupDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteVisaPriceSetup(priceSetup!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-price-setups"] })
      toast.success("Price setup deleted.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to delete price setup.")
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Price Setup</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{priceSetupLabel(priceSetup)}</span>?
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
