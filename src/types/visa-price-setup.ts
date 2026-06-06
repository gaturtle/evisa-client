import type { VisaType, VisaProcessing } from "@/types/visa-type"

export interface VisaPriceSetup {
  id: string
  visaTypeId: string
  visaType: VisaType | null
  visaProcessingId: string
  visaProcessing: VisaProcessing | null
  price: number | null
}

export interface CreateVisaPriceSetupRequest {
  visaTypeId: string
  visaProcessingId: string
  price: number
}

export interface UpdateVisaPriceSetupRequest {
  visaTypeId: string
  visaProcessingId: string
  price: number
}
