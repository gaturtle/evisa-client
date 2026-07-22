import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import {
  addVisaProcessingException,
  getVisaProcessingExceptions,
  getVisaProcessingExcludedGroups,
  removeVisaProcessingException,
  setVisaProcessingExcludedGroups,
} from "@/api/visa-processing-exclusions"
import {
  getVisaProcessingNationalityPrices,
  removeVisaProcessingNationalityPrice,
  setVisaProcessingNationalityPrice,
} from "@/api/visa-processing-nationality-prices"
import { getNationalityGroups } from "@/api/nationality-groups"
import { getNationalities } from "@/api/nationalities"
import type { VisaProcessing } from "@/types/visa-processing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import { Sheet, SheetCloseButton, SheetContent } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function DrawerBody({ visaProcessing }: { visaProcessing: VisaProcessing }) {
  const queryClient = useQueryClient()
  const [groupIdsOverride, setGroupIdsOverride] = useState<string[] | null>(null)
  const [addNationalityId, setAddNationalityId] = useState("")
  const [addPriceNationalityId, setAddPriceNationalityId] = useState("")
  const [addPriceValue, setAddPriceValue] = useState("")
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [editPriceValue, setEditPriceValue] = useState("")

  const { data: groups = [] } = useQuery({
    queryKey: ["nationality-groups"],
    queryFn: getNationalityGroups,
  })

  const { data: nationalities = [] } = useQuery({
    queryKey: ["nationalities"],
    queryFn: getNationalities,
  })

  const { data: excludedGroupIds = [], isLoading: loadingExclusions } = useQuery({
    queryKey: ["visa-processing-excluded-groups", visaProcessing.id],
    queryFn: () => getVisaProcessingExcludedGroups(visaProcessing.id),
  })

  const { data: exceptions = [], isLoading: loadingExceptions } = useQuery({
    queryKey: ["visa-processing-exceptions", visaProcessing.id],
    queryFn: () => getVisaProcessingExceptions(visaProcessing.id),
  })

  const { data: nationalityPrices = [], isLoading: loadingPrices } = useQuery({
    queryKey: ["visa-processing-nationality-prices", visaProcessing.id],
    queryFn: () => getVisaProcessingNationalityPrices(visaProcessing.id),
  })

  const pendingGroupIds = groupIdsOverride ?? excludedGroupIds

  const saveGroupsMutation = useMutation({
    mutationFn: (groupIds: string[]) =>
      setVisaProcessingExcludedGroups(visaProcessing.id, groupIds, excludedGroupIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-processing-excluded-groups", visaProcessing.id] })
      setGroupIdsOverride(null)
      toast.success("Excluded groups updated.")
    },
    onError: () => toast.error("Failed to update excluded groups."),
  })

  const addExceptionMutation = useMutation({
    mutationFn: (nationalityId: string) => addVisaProcessingException(visaProcessing.id, nationalityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-processing-exceptions", visaProcessing.id] })
      setAddNationalityId("")
      toast.success("Exception added.")
    },
    onError: () => toast.error("Failed to add exception."),
  })

  const removeExceptionMutation = useMutation({
    mutationFn: (nationalityId: string) => removeVisaProcessingException(visaProcessing.id, nationalityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-processing-exceptions", visaProcessing.id] })
      toast.success("Exception removed.")
    },
    onError: () => toast.error("Failed to remove exception."),
  })

  const savePriceMutation = useMutation({
    mutationFn: ({ nationalityId, price }: { nationalityId: string; price: number }) =>
      setVisaProcessingNationalityPrice(visaProcessing.id, nationalityId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-processing-nationality-prices", visaProcessing.id] })
      setAddPriceNationalityId("")
      setAddPriceValue("")
      setEditingPriceId(null)
      toast.success("Nationality price saved.")
    },
    onError: () => toast.error("Failed to save nationality price."),
  })

  const removePriceMutation = useMutation({
    mutationFn: (nationalityId: string) => removeVisaProcessingNationalityPrice(visaProcessing.id, nationalityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-processing-nationality-prices", visaProcessing.id] })
      toast.success("Nationality price removed.")
    },
    onError: () => toast.error("Failed to remove nationality price."),
  })

  const groupsById = new Map(groups.map((g) => [g.id, g.name]))
  const nationalitiesById = new Map(nationalities.map((n) => [n.id, n.origName]))
  const hasGroupChanges =
    pendingGroupIds.length !== excludedGroupIds.length ||
    pendingGroupIds.some((id) => !excludedGroupIds.includes(id))

  const isValidPrice = (value: string) => value.trim() !== "" && Number(value) >= 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{visaProcessing.description}</p>
          <p className="truncate text-xs text-muted-foreground">Excluded Groups & Exceptions</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-8">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Excluded Groups
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Applicants whose nationality belongs to one of these groups cannot select this
            processing option at all, unless an exception applies below.
          </p>
          {!loadingExclusions && (
            <MultiCombobox
              className="mt-3"
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
              value={pendingGroupIds}
              onValueChange={setGroupIdsOverride}
              placeholder="No excluded groups"
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
            A specific nationality that can select this processing option even though its group is
            excluded, as if the exclusion never applied.
          </p>

          <div className="mb-3 mt-3 flex gap-2">
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
                excludedGroupIds.includes(nationality.groupId)
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

        <div className="mt-8">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Nationality Prices
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            A per-nationality price that replaces this option's default price. Independent of
            Excluded Groups and Exceptions — it applies whenever the option is selectable for that
            nationality.
          </p>

          <div className="mb-3 mt-3 flex gap-2">
            <div className="flex-1">
              <Combobox
                options={nationalities.map((n) => ({ value: n.id, label: n.origName }))}
                value={addPriceNationalityId}
                onValueChange={setAddPriceNationalityId}
                placeholder="Add a nationality…"
                searchPlaceholder="Search nationalities…"
                emptyText="No nationalities found."
              />
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Price"
              className="w-28"
              value={addPriceValue}
              onChange={(e) => setAddPriceValue(e.target.value)}
            />
            <Button
              size="sm"
              disabled={
                !addPriceNationalityId || !isValidPrice(addPriceValue) || savePriceMutation.isPending
              }
              onClick={() =>
                savePriceMutation.mutate({ nationalityId: addPriceNationalityId, price: Number(addPriceValue) })
              }
            >
              Add
            </Button>
          </div>

          {!loadingPrices && nationalityPrices.length === 0 && (
            <p className="text-sm italic text-muted-foreground">No nationality prices configured.</p>
          )}

          <div className="flex flex-col gap-2">
            {nationalityPrices.map((nationalityPrice) => {
              const isEditing = editingPriceId === nationalityPrice.id
              return (
                <div
                  key={nationalityPrice.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground/80">
                      {nationalitiesById.get(nationalityPrice.nationalityId) ?? "—"}
                    </span>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-7 w-24"
                        value={editPriceValue}
                        onChange={(e) => setEditPriceValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="text-muted-foreground">${nationalityPrice.price.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => setEditingPriceId(null)}
                          disabled={savePriceMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7"
                          disabled={!isValidPrice(editPriceValue) || savePriceMutation.isPending}
                          onClick={() =>
                            savePriceMutation.mutate({
                              nationalityId: nationalityPrice.nationalityId,
                              price: Number(editPriceValue),
                            })
                          }
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-muted-foreground"
                          onClick={() => {
                            setEditingPriceId(nationalityPrice.id)
                            setEditPriceValue(String(nationalityPrice.price))
                          }}
                        >
                          Edit
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removePriceMutation.mutate(nationalityPrice.nationalityId)}
                              disabled={removePriceMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

interface VisaProcessingExclusionsDrawerProps {
  visaProcessing: VisaProcessing | null
  onClose: () => void
}

export function VisaProcessingExclusionsDrawer({ visaProcessing, onClose }: VisaProcessingExclusionsDrawerProps) {
  return (
    <Sheet open={!!visaProcessing} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent>
        <div className="absolute right-3 top-3 z-10">
          <SheetCloseButton />
        </div>
        {visaProcessing && <DrawerBody key={visaProcessing.id} visaProcessing={visaProcessing} />}
      </SheetContent>
    </Sheet>
  )
}
