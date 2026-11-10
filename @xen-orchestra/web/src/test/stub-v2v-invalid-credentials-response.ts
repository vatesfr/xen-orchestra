import { stubFetchResponse } from '@/test/stub-fetch-response.ts'
import { V2V_ERROR_CODE } from '@vates/types'

// What the V2V routes answer when VMware rejects the username or the password
export function stubV2vInvalidCredentialsResponse() {
  return stubFetchResponse(422, { error: 'invalid credentials', data: { code: V2V_ERROR_CODE.INVALID_CREDENTIALS } })
}
