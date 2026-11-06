import type { BackupJobFormOption } from '@/modules/backup-job/types/backup-job-form.type.ts'

export function formatSelectedLabels(options: BackupJobFormOption<number>[], values: number[]): string | undefined {
  return values.length === 0
    ? undefined
    : options
        .filter(option => values.includes(option.value))
        .map(option => option.label)
        .join(', ')
}
