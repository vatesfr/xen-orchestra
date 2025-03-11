import { Branded } from '@vates/types'

// Required because Branded<string> is not a primitive type
// and TSOA is not able to correctly convert Branded when generating
// the openapi specification
export type Unbrand<T> = {
  [K in keyof T]: T[K] extends Branded<string> | undefined
    ? string | undefined
    : T[K] extends Branded<string>[]
      ? string[]
      : T[K] extends Branded<string>
        ? string
        : T[K]
}

export const actionAsyncroneResp = {
  status: 202,
  description: 'Action executed asynchronously',
  produce: 'text/plain',
} as const

export const unauthorizedResp = {
  status: 401,
  description: 'Authentication required',
} as const

export const notFoundResp = {
  status: 404,
  description: 'Resource not found',
} as const

export const noContentResp = {
  status: 204,
  description: 'No content',
} as const

export const internalServerErrorResp = {
  status: 500,
  description: 'Internal server error, XenServer/XCP-ng error',
} as const
