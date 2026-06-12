import { apiClient } from "./client"
import type { LoginRequest, LoginResponse } from "@/types/auth"
import type { ApiResponse } from "@/types/api"

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    "/api/v1/auth/login",
    data
  )
  return response.data.data!
}
