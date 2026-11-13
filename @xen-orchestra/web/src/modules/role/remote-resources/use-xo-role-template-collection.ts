import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAclRole } from '@vates/types'

export type FrontXoRoleTemplate = Pick<
  Extract<XoAclRole, { isTemplate: true }>,
  'id' | 'name' | 'description' | 'privilegeIds' | 'isTemplate'
>

const roleTemplateFields = [
  'id',
  'name',
  'description',
  'privilegeIds',
  'isTemplate',
] as const satisfies readonly (keyof FrontXoRoleTemplate)[]

export const useXoRoleTemplateCollection = defineRemoteResource({
  url: `${BASE_URL}/acl-roles?fields=${roleTemplateFields.join(',')}&filter=isTemplate?&ndjson=true`,
  stream: true,
  pollingIntervalMs: false,
  initialData: () => [] as FrontXoRoleTemplate[],
  state: (roleTemplates, context) => {
    return useXoCollectionState(roleTemplates, {
      context,
      baseName: 'roleTemplate',
    })
  },
})
