export type MaybePromise<T> = T | Promise<T>

export type WithHref<T> = T & { href: string }
