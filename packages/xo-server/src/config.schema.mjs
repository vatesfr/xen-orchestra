import { z } from 'zod'

// Sentinel for redacted values — use a string so Swagger renders it clearly
const redacted = z.any().transform(() => '**REDACTED**')

// Mirror the shape of xo-server's config here.
// .partial() on every object because config files are always partial — missing keys are fine.
export const XoServerConfigSchema = z
  .object({
    redis: z
      .object({
        uri: redacted, // contains credentials
        socket: z.string().optional(),
      })
      .partial()
      .optional(),

    http: z
      .object({
        port: z.number().optional(),
        host: z.string().optional(),
        sessionSecret: redacted,
        cookies: z.record(z.unknown()).optional(),
        useForwardedHeaders: z.unknown().optional(),
        proxies: z.record(z.unknown()).optional(),
        publicMounts: z.record(z.string()).optional(),
        mounts: z.record(z.string()).optional(),
        helmet: z.record(z.unknown()).optional(),
      })
      .partial()
      .optional(),

    authentication: z
      .object({
        defaultTokenValidity: z.string().optional(),
        maxTokenValidity: z.string().optional(),
        providers: z.record(z.unknown()).optional(), // provider configs may have secrets — review per provider
      })
      .partial()
      .optional(),

    backups: z
      .object({
        dirMode: z.string().optional(),
        vhdDirectoryCompression: z.string().optional(),
        listingDebounce: z.string().optional(),
        useGetDiskLegacy: z.boolean().optional(),
      })
      .partial()
      .optional(),

    datadir: z.string().optional(),
    resourceCacheDelay: z.string().optional(),

    // Add more sections as needed.
    // Unknown top-level keys are passed through but redacted (see .catchall() below).
  })
  .catchall(z.any().transform(() => '**REDACTED**'))
// Unknown keys are preserved in the output so their presence is visible for debugging,
// but their values are always redacted.

// Exported helper used by Config.mjs
export function applySchema(raw) {
  const result = XoServerConfigSchema.safeParse(raw)
  if (!result.success) {
    // Schema is permissive (.partial everywhere) so this should be rare.
    // Log but don't throw — return what we can.
    return {}
  }
  return result.data
}
