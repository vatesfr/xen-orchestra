import { COLLECTION_PATHS, type SelectablePrivilegeResource } from '@/modules/role/utils/privilege-catalogue.util.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { get } from 'lodash-es'
import { toValue } from 'vue'

type ObjectPrivilegeResource = Exclude<SelectablePrivilegeResource, 'acl-privilege'>

export type PrivilegeSelectorMatch = {
  id: string
  name: string
}

const LABEL_PATHS: Record<ObjectPrivilegeResource, string[]> = {
  'acl-role': ['name'],
  alarm: ['name'],
  'backup-archive': ['vm.name_label'],
  'backup-job': ['name'],
  'backup-log': ['jobName'],
  'backup-repository': ['name'],
  group: ['name'],
  host: ['name_label'],
  message: ['name'],
  network: ['name_label'],
  pbd: [],
  pci: ['device_name'],
  pgpu: [],
  pif: ['device'],
  pool: ['name_label'],
  proxy: ['name'],
  'restore-log': [],
  schedule: ['name'],
  server: ['label', 'host'],
  sm: ['name_label'],
  sr: ['name_label'],
  task: ['properties.name'],
  user: ['username', 'email'],
  vbd: ['device'],
  vdi: ['name_label'],
  'vdi-snapshot': ['name_label'],
  vif: ['MAC'],
  vm: ['name_label'],
  'vm-controller': ['name_label'],
  'vm-snapshot': ['name_label'],
  'vm-template': ['name_label'],
}

function getLabel(object: Record<string, unknown>, labelPaths: string[]): string | undefined {
  return labelPaths
    .map(labelPath => get(object, labelPath))
    .find((label): label is string => typeof label === 'string' && label !== '')
}

export const useXoPrivilegeSelectorMatchesCollection = defineRemoteResource({
  url: (resource: ObjectPrivilegeResource | undefined, selector: string) => {
    if (resource === undefined) {
      return ''
    }

    const fields = ['id', ...LABEL_PATHS[resource]].join(',')

    const baseUrl = `${BASE_URL}/${COLLECTION_PATHS[resource]}?fields=${fields}`

    const url = resource === 'backup-archive' ? `${baseUrl}&backup-repository=*` : baseUrl

    // An empty selector lists every object of the resource, as a privilege without selector applies to them all.
    return selector === '' ? url : `${url}&filter=${encodeURIComponent(selector)}`
  },

  initialData: () => [] as PrivilegeSelectorMatch[],

  onDataReceived: async (matches, objects: (Record<string, unknown> & { id: string })[], _calledFrom, context) => {
    const resource = toValue(context?.args[0])

    const labelPaths = resource === undefined ? [] : LABEL_PATHS[resource]

    matches.value = objects.map(object => ({ id: object.id, name: getLabel(object, labelPaths) ?? object.id }))
  },

  pollingIntervalMs: false,

  state: matches => ({ matches }),
})
