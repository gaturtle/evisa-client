// PROTOTYPE — throwaway. Switches between the current production drawer and three
// structurally different redesigns via `?variant=`. See ai-docs/plans/applications-page.md
// Phase 3 for the shipped design this is exploring alternatives to.
import { PrototypeSwitcher, useVariantParam } from "@/components/prototype/PrototypeSwitcher"
import { ApplicationDetailDrawer } from "./ApplicationDetailDrawer"
import { DetailDrawerVariantA } from "./detail-drawer-prototype/DetailDrawerVariantA"
import { DetailDrawerVariantB } from "./detail-drawer-prototype/DetailDrawerVariantB"
import { DetailDrawerVariantC } from "./detail-drawer-prototype/DetailDrawerVariantC"

const VARIANTS = [
  { key: "current", label: "Current — sectioned scroll" },
  { key: "A", label: "Tabbed sheet" },
  { key: "B", label: "Full-screen inspector" },
  { key: "C", label: "Timeline + dense rows" },
]

interface Props {
  applicationId: string | null
  onClose: () => void
}

export function ApplicationDetailDrawerPrototype({ applicationId, onClose }: Props) {
  const [variant, setVariant] = useVariantParam("current")

  return (
    <>
      {variant === "current" && <ApplicationDetailDrawer applicationId={applicationId} onClose={onClose} />}
      {variant === "A" && <DetailDrawerVariantA applicationId={applicationId} onClose={onClose} />}
      {variant === "B" && <DetailDrawerVariantB applicationId={applicationId} onClose={onClose} />}
      {variant === "C" && <DetailDrawerVariantC applicationId={applicationId} onClose={onClose} />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={setVariant} />
    </>
  )
}
