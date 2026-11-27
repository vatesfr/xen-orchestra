export type BackupJobFormOption<TValue> = { label: string; value: TValue; description?: string }

export type BackupJobScopeType = 'all' | 'manual' | 'smart'

export type BackupJobFormStep = 'source' | 'transfer' | 'target' | 'planning' | 'review'

export type BackupJobFormDataStep = Exclude<BackupJobFormStep, 'review'>
