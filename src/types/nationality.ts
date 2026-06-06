export interface VisaNationality {
  id: string
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays: number | null
}

export interface CreateNationalityRequest {
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays?: number
}

export interface UpdateNationalityRequest {
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays?: number
}
