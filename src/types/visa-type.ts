export interface VisaType {
  id: string
  description: string
  price: number
}

export interface CreateVisaTypeRequest {
  description: string
  price: number
}

export interface UpdateVisaTypeRequest {
  description: string
  price: number
}
