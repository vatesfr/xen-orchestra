export interface UpdateUserRequestBody {
  name?: string
  password?: string
  permission?: string
  preferences?: Record<string, string>
}
