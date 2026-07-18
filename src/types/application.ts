export const ApplicationStatus = {
  Submitted: 0,
  UnderReview: 1,
  Approved: 2,
  Rejected: 3,
  RequiresAction: 4,
  Cancelled: 5,
  PendingReview: 6,
} as const
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus]

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.Submitted]: "Submitted",
  [ApplicationStatus.UnderReview]: "Under Review",
  [ApplicationStatus.Approved]: "Approved",
  [ApplicationStatus.Rejected]: "Rejected",
  [ApplicationStatus.RequiresAction]: "Requires Action",
  [ApplicationStatus.Cancelled]: "Cancelled",
  [ApplicationStatus.PendingReview]: "Pending Review",
}

export const PaymentStatus = {
  Pending: 0,
  Succeeded: 1,
  Failed: 2,
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: "Pending",
  [PaymentStatus.Succeeded]: "Succeeded",
  [PaymentStatus.Failed]: "Failed",
}

export interface VisaApplicationListItem {
  id: string
  referenceNumber: string
  status: ApplicationStatus
  contactFullName: string
  contactEmail: string
  createdDateTime: string
  applicantCount: number
  visaTypeId: string
  processingOptionId: string
}

export interface PaginatedApplications {
  totalCount: number
  page: number
  pageSize: number
  items: VisaApplicationListItem[]
}

export interface ApplicationListParams {
  page: number
  pageSize: number
  status?: ApplicationStatus
  from?: string
  to?: string
}

export interface Applicant {
  id: string
  firstName: string
  lastName: string
  nationality: string
  passportPhotoPath: string | null
  portraitPhotoPath: string | null
  documentPath: string | null
}

export interface PaymentRecord {
  id: string
  stripeIntentId: string
  amount: number
  currency: string
  status: PaymentStatus
  createdDateTime: string
}

export interface VisaApplicationDetail {
  id: string
  referenceNumber: string
  status: ApplicationStatus
  purposeOfTravel: string
  visaTypeId: string
  processingOptionId: string
  entryDate: string
  exitDate: string
  contactFullName: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  isUrgentProcessing: boolean
  isMultipleEntry: boolean
  isAirportTransfer: boolean
  isOther: boolean
  notes: string | null
  processingStartDate: string | null
  completedDateTime: string | null
  createdDateTime: string
  modifiedDateTime: string
  applicants: Applicant[]
  payment: PaymentRecord | null
}

export interface UpdateStatusRequest {
  status: ApplicationStatus
  reason?: string
}

export interface UpdateApplicationApplicant {
  firstName: string
  lastName: string
  nationality: string
}

export interface UpdateApplicationRequest {
  contactFullName: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  entryDate: string
  exitDate: string
  visaTypeId: string
  processingOptionId: string
  isUrgentProcessing?: boolean
  isMultipleEntry?: boolean
  isAirportTransfer?: boolean
  isOther?: boolean
  notes?: string
  applicants: UpdateApplicationApplicant[]
}
