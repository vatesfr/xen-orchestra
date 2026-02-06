import { Branded } from '../common.mjs'

export type XoAclRole =
  | {
      id: Branded<'acl-v2-role'>
      name: string
      description?: string
    }
  | {
      id: Branded<'acl-v2-role'>
      name: string
      description?: string
      isTemplate: true
      roleTemplateId: number
    }
