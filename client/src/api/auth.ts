import { post, get, setToken, clearToken } from './client'

export interface LoginParams { username: string; password: string }
export interface UserInfo { id: number; shopId: number; username: string; role: string; avatarUrl: string }
export interface LoginResult { token: string; user: UserInfo }

export function login(params: LoginParams): Promise<LoginResult> {
  return post<LoginResult>('/auth/login', params).then((data) => {
    setToken(data.token)
    return data
  })
}

export function logout() {
  clearToken()
}

export function getMe(): Promise<UserInfo> {
  return get<UserInfo>('/auth/me')
}
