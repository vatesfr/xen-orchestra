export function formatToolError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error occurred'
}
