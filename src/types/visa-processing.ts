export interface VisaProcessing {
  id: string
  description: string
  price: number
  minDays: number | null
  maxDays: number | null
}

export interface CreateVisaProcessingRequest {
  description: string
  price: number
  minDays: number | null
  maxDays: number | null
}

export interface UpdateVisaProcessingRequest {
  description: string
  price: number
  minDays: number | null
  maxDays: number | null
}
