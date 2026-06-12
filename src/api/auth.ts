import { apiClient } from "./client"
import type {
  LoginRequest,
  LoginResponse,
  AdminUser,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/types/auth"
import type { ApiResponse } from "@/types/api"

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    "/api/v1/auth/login",
    data
  )
  return response.data.data!
}

export async function getUsers(): Promise<AdminUser[]> {
  const response = await apiClient.get<ApiResponse<AdminUser[]>>("/api/v1/auth/users")
  return response.data.data ?? []
}

export async function createUser(data: CreateUserRequest): Promise<AdminUser> {
  const response = await apiClient.post<ApiResponse<AdminUser>>("/api/v1/auth/users", data)
  return response.data.data!
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<AdminUser> {
  const response = await apiClient.put<ApiResponse<AdminUser>>(`/api/v1/auth/users/${id}`, data)
  return response.data.data!
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/auth/users/${id}`)
}
