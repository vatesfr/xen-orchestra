import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { XoClient } from '../../xo-client.mjs'
import { formatToolError } from '../../helpers/tool-error.mjs'

interface ListToolDef {
  name: string
  title: string
  description: string
  endpoint: string
  defaultFields: string
  errorLabel: string
}

interface DetailToolDef {
  name: string
  title: string
  description: string
  endpoint: string
  paramName: string
  paramDescription: string
  errorLabel: string
}

const LIST_TOOLS: ListToolDef[] = [
  {
    name: 'list_vms',
    title: 'List Virtual Machines',
    description: 'List virtual machines in Xen Orchestra with optional filtering',
    endpoint: '/vms',
    defaultFields: 'id,name_label,power_state,CPUs,memory',
    errorLabel: 'list VMs',
  },
  {
    name: 'list_hosts',
    title: 'List Hosts',
    description: 'List all hosts (hypervisors) in Xen Orchestra',
    endpoint: '/hosts',
    defaultFields: 'id,name_label,productBrand,version,power_state,memory,address',
    errorLabel: 'list hosts',
  },
  {
    name: 'list_pools',
    title: 'List Pools',
    description: 'List all pools in Xen Orchestra with their basic information',
    endpoint: '/pools',
    defaultFields: 'id,name_label,name_description,auto_poweron,HA_enabled',
    errorLabel: 'list pools',
  },
  {
    name: 'list_srs',
    title: 'List Storage Repositories',
    description: 'List storage repositories (SRs) in Xen Orchestra with optional filtering',
    endpoint: '/srs',
    defaultFields: 'id,name_label,SR_type,allocationStrategy,size,usage,physical_usage,shared',
    errorLabel: 'list SRs',
  },
  {
    name: 'list_vdis',
    title: 'List Virtual Disks',
    description: 'List virtual disks (VDIs) in Xen Orchestra with optional filtering',
    endpoint: '/vdis',
    defaultFields: 'id,name_label,name_description,$SR,size,usage,VDI_type',
    errorLabel: 'list VDIs',
  },
  {
    name: 'list_networks',
    title: 'List Networks',
    description: 'List all networks in Xen Orchestra with optional filtering',
    endpoint: '/networks',
    defaultFields: 'id,name_label,name_description,bridge,MTU,nbd',
    errorLabel: 'list networks',
  },
]

const DETAIL_TOOLS: DetailToolDef[] = [
  {
    name: 'get_vm_details',
    title: 'Get VM Details',
    description: 'Get detailed information about a specific virtual machine',
    endpoint: '/vms',
    paramName: 'vm_id',
    paramDescription: 'The VM ID or UUID',
    errorLabel: 'get VM details',
  },
  {
    name: 'get_sr_details',
    title: 'Get SR Details',
    description: 'Get detailed information about a specific storage repository',
    endpoint: '/srs',
    paramName: 'sr_id',
    paramDescription: 'The SR ID or UUID',
    errorLabel: 'get SR details',
  },
  {
    name: 'get_network_details',
    title: 'Get Network Details',
    description: 'Get detailed information about a specific network',
    endpoint: '/networks',
    paramName: 'network_id',
    paramDescription: 'The network ID',
    errorLabel: 'get network details',
  },
]

export function registerQueryTools(server: McpServer, getClient: () => XoClient): void {
  for (const tool of LIST_TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: {
          filter: z.string().optional().meta({ description: 'Filter expression' }),
          fields: z.string().optional().meta({ description: 'Comma-separated fields to return' }),
          limit: z.number().optional().meta({ description: 'Maximum number of results to return' }),
        },
      },
      async ({ filter, fields, limit }) => {
        try {
          const client = getClient()
          const text = await client.getMarkdown(tool.endpoint, tool.defaultFields, { filter, fields, limit })
          return { content: [{ type: 'text', text }] }
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Failed to ${tool.errorLabel}: ${formatToolError(error)}` }],
            isError: true,
          }
        }
      }
    )
  }

  for (const tool of DETAIL_TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: {
          [tool.paramName]: z.string().min(1).meta({ description: tool.paramDescription }),
        },
      },
      async args => {
        try {
          const client = getClient()
          const id = String((args as Record<string, unknown>)[tool.paramName])
          const text = await client.getMarkdown(`${tool.endpoint}/${encodeURIComponent(id)}`, '*')
          return { content: [{ type: 'text', text }] }
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Failed to ${tool.errorLabel}: ${formatToolError(error)}` }],
            isError: true,
          }
        }
      }
    )
  }
}
