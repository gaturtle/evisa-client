import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { deletePost } from "@/api/posts"
import type { Post } from "@/types/post"
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

interface DeletePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post | null
}

export function DeletePostDialog({
  open,
  onOpenChange,
  post,
}: DeletePostDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deletePost(post!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      toast.success("Post deleted.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Failed to delete post.")
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{post?.title}</span>?
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
