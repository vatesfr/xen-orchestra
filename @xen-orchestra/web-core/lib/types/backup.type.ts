import type { RouteLocationRaw } from 'vue-router'

export type BackupState = 'success' | 'failure' | 'partial'

export type BackupStates = BackupState[]

export type Backup = {
  label: string
  route?: RouteLocationRaw
  states: BackupStates
}
