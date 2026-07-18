export interface VisaNationality {
  id: string
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays: number | null
  groupId: string | null
}

export interface CreateNationalityRequest {
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays?: number
  groupId?: string
}

export interface UpdateNationalityRequest {
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays?: number
  groupId?: string
}
