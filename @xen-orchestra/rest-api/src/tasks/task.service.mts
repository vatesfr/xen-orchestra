import type { XapiXoRecord, XoTask } from '@vates/types'
import { RestApi } from '../rest-api/rest-api.mjs'
import { BASE_URL } from '../index.mjs'
import type { ResolvedReference, ResolvedReferences, XoTaskWithResolvedReferences } from './task.type.mjs'

// UUID v4 regex pattern
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

// Mapping from XO object types to REST API routes
const TYPE_TO_ROUTE: Record<string, string> = {
  VM: 'vms',
  'VM-snapshot': 'vm-snapshots',
  'VM-template': 'vm-templates',
  'VM-controller': 'vm-controllers',
  host: 'hosts',
  pool: 'pools',
  SR: 'srs',
  VDI: 'vdis',
  'VDI-snapshot': 'vdi-snapshots',
  'VDI-unmanaged': 'vdi-unmanaged',
  VBD: 'vbds',
  VIF: 'vifs',
  network: 'networks',
  PIF: 'pifs',
  PBD: 'pbds',
  message: 'messages',
  VTPM: 'vtpms',
}

export class TaskService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * Extract UUIDs from a value (string, object, array) recursively
   */
  #extractUuids(value: unknown, uuids: Set<string>): void {
    if (typeof value === 'string') {
      const matches = value.match(UUID_REGEX)
      if (matches) {
        for (const match of matches) {
          uuids.add(match.toLowerCase())
        }
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        this.#extractUuids(item, uuids)
      }
    } else if (value !== null && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        this.#extractUuids((value as Record<string, unknown>)[key], uuids)
      }
    }
  }

  /**
   * Extract all UUIDs from a task (properties, result, data, infos, warnings, tasks)
   */
  #extractUuidsFromTask(task: XoTask): Set<string> {
    const uuids = new Set<string>()

    this.#extractUuids(task.properties, uuids)
    this.#extractUuids(task.result, uuids)
    this.#extractUuids(task.data, uuids)
    this.#extractUuids(task.infos, uuids)
    this.#extractUuids(task.warnings, uuids)

    // Recursively extract from subtasks
    if (task.tasks) {
      for (const subtask of task.tasks) {
        const subtaskUuids = this.#extractUuidsFromTask(subtask)
        for (const uuid of subtaskUuids) {
          uuids.add(uuid)
        }
      }
    }

    return uuids
  }

  /**
   * Build the REST href for an object based on its type and UUID
   */
  #buildHref(type: string, uuid: string): string | undefined {
    const route = TYPE_TO_ROUTE[type]
    if (route === undefined) {
      return undefined
    }
    return `${BASE_URL}/${route}/${uuid}`
  }

  /**
   * Resolve a UUID to a ResolvedReference or undefined if not found
   */
  #resolveUuid(uuid: string): ResolvedReference | undefined {
    try {
      const object = this.#restApi.getObject<XapiXoRecord>(uuid as XapiXoRecord['id'])
      const href = this.#buildHref(object.type, object.uuid)

      if (href === undefined) {
        return undefined
      }

      return {
        type: object.type,
        name: 'name_label' in object ? (object.name_label as string) : object.uuid,
        href,
      }
    } catch {
      // Object not found or not accessible
      return undefined
    }
  }

  /**
   * Enrich a task with resolvedReferences
   */
  enrichTask(task: XoTask): XoTaskWithResolvedReferences {
    const uuids = this.#extractUuidsFromTask(task)
    const resolvedReferences: ResolvedReferences = {}

    for (const uuid of uuids) {
      const resolved = this.#resolveUuid(uuid)
      if (resolved !== undefined) {
        resolvedReferences[uuid] = resolved
      }
    }

    return {
      ...task,
      resolvedReferences,
    }
  }
}
