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

export type WithHref<T> = T & { href: string }
