export interface VisaExemption {
  id: string
  exemptionDays: number
  nationalityId: string
}

export interface VisaNationality {
  id: string
  origName: string
  vietnameseName: string
  isEligible: boolean
  visaExemption: VisaExemption | null
}

export interface CreateNationalityRequest {
  origName: string
  vietnameseName: string
  isEligible: boolean
}

export interface UpdateNationalityRequest {
  origName: string
  vietnameseName: string
  isEligible: boolean
}
