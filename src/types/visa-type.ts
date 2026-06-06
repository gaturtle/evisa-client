export interface VisaProcessing {
  id: string
  description: string
  visaTypes: VisaType[] | null
}

export interface VisaType {
  id: string
  description: string
  visaProcessings: VisaProcessing[] | null
}

export interface CreateVisaTypeRequest {
  description: string
}

export interface UpdateVisaTypeRequest {
  description: string
}
