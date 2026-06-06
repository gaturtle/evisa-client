export interface VisaProcessing {
  id: string
  description: string
  price: number
}

export interface CreateVisaProcessingRequest {
  description: string
  price: number
}

export interface UpdateVisaProcessingRequest {
  description: string
  price: number
}
