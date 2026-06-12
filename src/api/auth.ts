import { apiClient } from "./client"
import type { LoginRequest, LoginResponse, AdminUser } from "@/types/auth"
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
