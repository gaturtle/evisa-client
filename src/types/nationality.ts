export interface VisaNationality {
  id: string
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays: number | null
  groupId: string | null
  requiresExtraDetails: boolean
}

export interface CreateNationalityRequest {
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays?: number
  groupId?: string
  requiresExtraDetails?: boolean
}

export interface UpdateNationalityRequest {
  origName: string
  vietnameseName: string
  isEligible: boolean
  exemptionDays?: number
  groupId?: string
  requiresExtraDetails?: boolean
}
