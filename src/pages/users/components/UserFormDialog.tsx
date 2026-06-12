import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axios from "axios"

import { createUser, updateUser } from "@/api/auth"
import type { AdminUser } from "@/types/auth"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "Staff", label: "Staff" },
]

const createSchema = z.object({
  email: z.string().min(1, "Email is required").email("Must be a valid email"),
  fullName: z.string().min(1, "Full name is required"),
  password: z.string().min(1, "Password is required"),
  role: z.string().min(1, "Role is required"),
})

const editSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  role: z.string().min(1, "Role is required"),
  isActive: z.boolean(),
})

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>
type FormValues = CreateValues | EditValues

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget?: AdminUser
}

export function UserFormDialog({ open, onOpenChange, editTarget }: UserFormDialogProps) {
  const isEdit = !!editTarget
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? editSchema : createSchema) as any,
    defaultValues: isEdit
      ? { fullName: editTarget.fullName, role: editTarget.role, isActive: editTarget.isActive }
      : { email: "", fullName: "", password: "", role: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        isEdit
          ? { fullName: editTarget!.fullName, role: editTarget!.role, isActive: editTarget!.isActive }
          : { email: "", fullName: "", password: "", role: "" }
      )
    }
  }, [open, editTarget, isEdit, form])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (isEdit) {
        const v = values as EditValues
        return updateUser(editTarget!.id, {
          fullName: v.fullName,
          role: v.role,
          isActive: v.isActive,
        })
      }
      const v = values as CreateValues
      return createUser({ email: v.email, fullName: v.fullName, password: v.password, role: v.role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success(isEdit ? "User updated." : "User created.")
      onOpenChange(false)
    },
    onError: (error) => {
      if (!isEdit && axios.isAxiosError(error) && error.response?.status === 400) {
        toast.error(error.response.data?.message ?? "Email is already taken.")
      } else {
        toast.error(isEdit ? "Failed to update user." : "Failed to create user.")
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            {!isEdit && (
              <FormField
                control={form.control}
                name={"email" as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <FormField
                control={form.control}
                name={"password" as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Combobox
                      options={ROLE_OPTIONS}
                      value={field.value as string}
                      onValueChange={field.onChange}
                      placeholder="Select a role…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit && (
              <FormField
                control={form.control}
                name={"isActive" as never}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
            )}

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
                {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
