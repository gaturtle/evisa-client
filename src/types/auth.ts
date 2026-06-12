export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresAt: string
  role: string
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  role: string
  isActive: boolean
}

export interface CreateUserRequest {
  email: string
  fullName: string
  password: string
  role: string
}

export interface UpdateUserRequest {
  fullName: string
  role: string
  isActive: boolean
}
