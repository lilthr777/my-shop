const BASE_URL = 'http://localhost:3000/api/v1'

export interface ApiResponse<T> {
  code: number
  data: T
  msg?: string
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

export function clearToken(): void {
  localStorage.removeItem('token')
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const json: ApiResponse<T> = await res.json()

  if (json.code === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error(json.msg || '未登录')
  }

  if (json.code !== 0) {
    throw new Error(json.msg || '请求失败')
  }

  return json.data
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path)
}

export function post<T>(path: string, body?: any): Promise<T> {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
}

export function put<T>(path: string, body?: any): Promise<T> {
  return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined })
}

export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}
