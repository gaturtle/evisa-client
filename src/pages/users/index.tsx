import { useState } from "react"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { getUsers } from "@/api/auth"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableContainer } from "@/components/ui/table-container"

export function UsersPage() {
  const [search, setSearch] = useState("")

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  const filtered = data.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Users</h2>
        <p className="text-sm text-muted-foreground">
          Manage admin user accounts and their access levels.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <TableContainer className="shrink-0">
        <Table className="min-w-max table-fixed text-sm [&_tr]:border-border/40">
          <colgroup>
            <col style={{ width: 200 }} />
            <col style={{ width: 240 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-muted/80">
            <TableRow className="hover:bg-muted/80">
              <TableHead className="px-4 text-muted-foreground/70">Full Name</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Email</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Role</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={4} className="px-4 py-12 text-center text-destructive">
                  Failed to load users.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              filtered.map((user, index) => (
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
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <p className="mt-2 text-xs text-muted-foreground shrink-0">
        {filtered.length} of {data.length} users
      </p>
    </div>
  )
}
