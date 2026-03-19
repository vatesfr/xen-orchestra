type FormatterFn = (data: unknown) => string

const registry = new Map<string, FormatterFn>()

function key(tag: string, operation: string): string {
  return `${tag}:${operation}`
}

export function registerFormatter(tag: string, operation: string, fn: FormatterFn): void {
  registry.set(key(tag, operation), fn)
}

export function getFormatter(tag: string, operation: string): FormatterFn | undefined {
  return registry.get(key(tag, operation))
}

export function formatResponse(tag: string, operation: string, data: unknown): string {
  const formatter = getFormatter(tag, operation)
  if (formatter) {
    return formatter(data)
  }
  return JSON.stringify(data, null, 2)
}
