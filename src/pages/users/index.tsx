import { useState } from "react"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { getUsers } from "@/api/auth"
import type { AdminUser } from "@/types/auth"
import { useAuth } from "@/context/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TableContainer } from "@/components/ui/table-container"
import { UserFormDialog } from "./components/UserFormDialog"
import { DeleteUserDialog } from "./components/DeleteUserDialog"

export function UsersPage() {
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminUser | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const { email: currentEmail } = useAuth()

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  const filtered = data.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setEditTarget(undefined)
    setFormOpen(true)
  }

  function openEdit(user: AdminUser) {
    setEditTarget(user)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Users</h2>
        <p className="text-sm text-muted-foreground">
          Manage admin user accounts and their access levels.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <TableContainer className="shrink-0">
        <Table className="min-w-max table-fixed text-sm [&_tr]:border-border/40">
          <colgroup>
            <col style={{ width: 200 }} />
            <col style={{ width: 240 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 90 }} />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-muted/80">
            <TableRow className="hover:bg-muted/80">
              <TableHead className="px-4 text-muted-foreground/70">Full Name</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Email</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Role</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Status</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-12 text-center text-destructive">
                  Failed to load users.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              filtered.map((user, index) => {
                const isSelf = user.email === currentEmail
                return (
                  <TableRow
                    key={user.id}
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                  >
                    <TableCell className="px-4 font-medium text-foreground/80">
                      {user.fullName}
                    </TableCell>
                    <TableCell className="px-4 text-foreground/60">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      {user.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => openEdit(user)}
                              disabled={isSelf}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isSelf ? "Cannot edit your own account" : "Edit"}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(user)}
                              disabled={isSelf}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isSelf ? "Cannot delete your own account" : "Delete"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <p className="mt-2 text-xs text-muted-foreground shrink-0">
        {filtered.length} of {data.length} users
      </p>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editTarget={editTarget}
      />

      <DeleteUserDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        user={deleteTarget}
      />
    </div>
  )
}
