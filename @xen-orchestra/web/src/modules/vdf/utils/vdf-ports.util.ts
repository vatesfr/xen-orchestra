import type { VdfPort } from '@/modules/vdf/types.ts'

// first and last port of a rule port, undefined if malformed
export function portBounds(port: VdfPort): [number, number] | undefined {
  const [low, high = low] = String(port).split('-').map(Number)

  if (!Number.isInteger(low) || !Number.isInteger(high) || low < 1 || high > 65535 || low > high) {
    return undefined
  }

  return [low, high]
}

// no ports: any port
export function portsContain(ports: VdfPort[] | undefined, port: number) {
  return (
    ports === undefined ||
    ports.length === 0 ||
    ports.some(candidate => {
      const bounds = portBounds(candidate)

      return bounds !== undefined && port >= bounds[0] && port <= bounds[1]
    })
  )
}
