export interface UpdateUserRequestBody {
  email?: string
  name?: string
  password?: string
  permission?: string
  preferences?: Record<string, string>
}
