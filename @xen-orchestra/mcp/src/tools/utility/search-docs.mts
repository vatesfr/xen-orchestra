import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { formatToolError } from '../../helpers/tool-error.mjs'

const DOC_FETCH_TIMEOUT_MS = 30_000

const XO_DOCS_BASE_URL = 'https://docs.xen-orchestra.com'

const DOC_TOPICS = [
  'installation',
  'configuration',
  'backups',
  'restapi',
  'manage',
  'users',
  'architecture',
  'troubleshooting',
  'releases',
] as const

export async function fetchDocumentation(path: string): Promise<string> {
  const url = `${XO_DOCS_BASE_URL}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(DOC_FETCH_TIMEOUT_MS),
    })
  } catch (cause) {
    throw new Error(`Cannot reach documentation server: ${cause instanceof Error ? cause.message : 'Unknown error'}`, {
      cause,
    })
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch documentation: HTTP ${response.status} ${response.statusText}`)
  }

  const html = await response.text()

  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')

  text = text
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n## $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()

  return text
}

export function registerSearchDocs(server: McpServer): void {
  server.registerTool(
    'search_documentation',
    {
      title: 'Search XO Documentation',
      description:
        'Search and retrieve Xen Orchestra documentation. Use this to help users understand XO features, configuration, and best practices.',
      inputSchema: {
        topic: z.enum(DOC_TOPICS).describe('Documentation topic to retrieve'),
      },
    },
    async ({ topic }) => {
      const path = `/${topic}`

      try {
        const content = await fetchDocumentation(path)
        return {
          content: [
            {
              type: 'text',
              text: `# XO Documentation: ${topic}\n\nSource: ${XO_DOCS_BASE_URL}${path}\n\n${content}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch documentation for "${topic}": ${formatToolError(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
  )
}
