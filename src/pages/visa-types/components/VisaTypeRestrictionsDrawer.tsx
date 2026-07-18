import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import {
  addVisaTypeException,
  getVisaTypeExceptions,
  getVisaTypeRestrictedGroups,
  removeVisaTypeException,
  setVisaTypeRestrictedGroups,
} from "@/api/visa-type-restrictions"
import { getNationalityGroups } from "@/api/nationality-groups"
import { getNationalities } from "@/api/nationalities"
import type { VisaType } from "@/types/visa-type"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import { Sheet, SheetCloseButton, SheetContent } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function DrawerBody({ visaType }: { visaType: VisaType }) {
  const queryClient = useQueryClient()
  const [groupIdsOverride, setGroupIdsOverride] = useState<string[] | null>(null)
  const [addNationalityId, setAddNationalityId] = useState("")

  const { data: groups = [] } = useQuery({
    queryKey: ["nationality-groups"],
    queryFn: getNationalityGroups,
  })

  const { data: nationalities = [] } = useQuery({
    queryKey: ["nationalities"],
    queryFn: getNationalities,
  })

  const { data: restrictedGroupIds = [], isLoading: loadingRestrictions } = useQuery({
    queryKey: ["visa-type-restricted-groups", visaType.id],
    queryFn: () => getVisaTypeRestrictedGroups(visaType.id),
  })

  const { data: exceptions = [], isLoading: loadingExceptions } = useQuery({
    queryKey: ["visa-type-exceptions", visaType.id],
    queryFn: () => getVisaTypeExceptions(visaType.id),
  })

  const pendingGroupIds = groupIdsOverride ?? restrictedGroupIds

  const saveGroupsMutation = useMutation({
    mutationFn: (groupIds: string[]) => setVisaTypeRestrictedGroups(visaType.id, groupIds, restrictedGroupIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-type-restricted-groups", visaType.id] })
      setGroupIdsOverride(null)
      toast.success("Restricted groups updated.")
    },
    onError: () => toast.error("Failed to update restricted groups."),
  })

  const addExceptionMutation = useMutation({
    mutationFn: (nationalityId: string) => addVisaTypeException(visaType.id, nationalityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-type-exceptions", visaType.id] })
      setAddNationalityId("")
      toast.success("Exception added.")
    },
    onError: () => toast.error("Failed to add exception."),
  })

  const removeExceptionMutation = useMutation({
    mutationFn: (exceptionId: string) => removeVisaTypeException(visaType.id, exceptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-type-exceptions", visaType.id] })
      toast.success("Exception removed.")
    },
    onError: () => toast.error("Failed to remove exception."),
  })

  const groupsById = new Map(groups.map((g) => [g.id, g.name]))
  const hasGroupChanges =
    pendingGroupIds.length !== restrictedGroupIds.length ||
    pendingGroupIds.some((id) => !restrictedGroupIds.includes(id))

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{visaType.description}</p>
          <p className="truncate text-xs text-muted-foreground">Restricted Groups & Exceptions</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-8">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Restricted Groups
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Applicants whose nationality belongs to one of these groups are flagged Pending at
            submission, unless an exception applies below.
          </p>
          {!loadingRestrictions && (
            <MultiCombobox
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
              value={pendingGroupIds}
              onValueChange={setGroupIdsOverride}
              placeholder="No restricted groups"
              searchPlaceholder="Search groups…"
              emptyText="No groups found."
            />
          )}
          {hasGroupChanges && (
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupIdsOverride(null)}
                disabled={saveGroupsMutation.isPending}
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => saveGroupsMutation.mutate(pendingGroupIds)}
                disabled={saveGroupsMutation.isPending}
              >
                {saveGroupsMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Exceptions
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            A specific nationality that is exempt from this visa type's group restriction, even if
            its group changes later.
          </p>

          <div className="mb-3 flex gap-2">
            <div className="flex-1">
              <Combobox
                options={nationalities.map((n) => ({ value: n.id, label: n.origName }))}
                value={addNationalityId}
                onValueChange={setAddNationalityId}
                placeholder="Add a nationality…"
                searchPlaceholder="Search nationalities…"
                emptyText="No nationalities found."
              />
            </div>
            <Button
              size="sm"
              disabled={!addNationalityId || addExceptionMutation.isPending}
              onClick={() => addExceptionMutation.mutate(addNationalityId)}
            >
              Add
            </Button>
          </div>

          {!loadingExceptions && exceptions.length === 0 && (
            <p className="text-sm italic text-muted-foreground">No exceptions configured.</p>
          )}

          <div className="flex flex-col gap-2">
            {exceptions.map((exception) => {
              const nationality = exception
              const isActive =
                !!nationality.groupId &&
                restrictedGroupIds.includes(nationality.groupId)
              return (
                <div
                  key={exception.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground/80">
                      {nationality.origName}
                    </span>
                    {isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">No effect</Badge>
                    )}
                    {nationality.groupId && (
                      <span className="text-xs text-muted-foreground">
                        Group: {groupsById.get(nationality.groupId) ?? "—"}
                      </span>
                    )}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeExceptionMutation.mutate(exception.id)}
                        disabled={removeExceptionMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove</TooltipContent>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

interface VisaTypeRestrictionsDrawerProps {
  visaType: VisaType | null
  onClose: () => void
}

export function VisaTypeRestrictionsDrawer({ visaType, onClose }: VisaTypeRestrictionsDrawerProps) {
  return (
    <Sheet open={!!visaType} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent>
        <div className="absolute right-3 top-3 z-10">
          <SheetCloseButton />
        </div>
        {visaType && <DrawerBody key={visaType.id} visaType={visaType} />}
      </SheetContent>
    </Sheet>
  )
}
