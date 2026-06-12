export interface Holiday {
  id: string
  date: string
  name: string
}

export interface CreateHolidayRequest {
  date: string
  name: string
}
