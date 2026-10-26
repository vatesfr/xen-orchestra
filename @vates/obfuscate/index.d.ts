export const OBFUSCATED_VALUE: string

export function isSensitiveParam(name: string): boolean

export function merge<T>(newValue: T, oldValue: T): T

export function obfuscate<T>(value: T): T

export function replace<T>(value: T, replacement: unknown): T
