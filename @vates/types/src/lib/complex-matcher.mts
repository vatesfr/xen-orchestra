export type Or<T> = Id<{ __or: T[] }>

export type Id<T> = { id: T }

export type IdOr<T> = Id<T> | Or<T>
