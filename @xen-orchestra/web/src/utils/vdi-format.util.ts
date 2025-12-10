export function getVdiFormat(format: string | undefined): string {
  return format !== undefined ? format.toUpperCase() : 'VHD'
}
