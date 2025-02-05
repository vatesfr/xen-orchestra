import { existsSync } from 'fs'
import { XapiItem } from '../types'

export const loadJson = async (path: string): Promise<XapiItem[]> => {
  if (!path) {
    console.error(`JSON path is required`)
    process.exit(1)
  }

  if (!existsSync(path)) {
    console.error(`File ${path} does not exist`)
    process.exit(1)
  }

  return (await import(path)).default;
}
