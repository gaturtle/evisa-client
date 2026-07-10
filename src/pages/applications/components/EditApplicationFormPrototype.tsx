// PROTOTYPE — throwaway. Switches between the current production edit form and three
// structurally different redesigns via `?variant=`. See ai-docs/plans/applications-page.md
// Phase 5 for the shipped design this is exploring alternatives to.
import { PrototypeSwitcher, useVariantParam } from "@/components/prototype/PrototypeSwitcher"
import { EditApplicationForm } from "./EditApplicationForm"
import { EditFormVariantA } from "./edit-form-prototype/EditFormVariantA"
import { EditFormVariantB } from "./edit-form-prototype/EditFormVariantB"
import { EditFormVariantC } from "./edit-form-prototype/EditFormVariantC"
import type { VisaApplicationDetail } from "@/types/application"
import type { VisaType } from "@/types/visa-type"
import type { VisaProcessing } from "@/types/visa-processing"

const VARIANTS = [
  { key: "current", label: "Current — sectioned scroll" },
  { key: "A", label: "Stepped wizard" },
  { key: "B", label: "Full-screen split inspector" },
  { key: "C", label: "Dense inline spreadsheet" },
]

interface Props {
  id: string
  detail: VisaApplicationDetail
  visaTypes: VisaType[]
  visaProcessings: VisaProcessing[]
  onCancel: () => void
  onSuccess: () => void
}

export function EditApplicationFormPrototype(props: Props) {
  const [variant, setVariant] = useVariantParam("current")

  return (
    <>
      {variant === "current" && <EditApplicationForm {...props} />}
      {variant === "A" && <EditFormVariantA {...props} />}
      {variant === "B" && <EditFormVariantB {...props} />}
      {variant === "C" && <EditFormVariantC {...props} />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={setVariant} />
    </>
  )
}
