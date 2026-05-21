export { basename, dirname, join } from 'path'

export declare const normalize: (path: string) => string
export declare function split(path: string): string[]
export declare const relativeFromFile: (file: string, path: string) => string
export declare const resolveFromFile: (file: string, path: string) => string
