export const XOA_NAME = 'Xen Orchestra Appliance'

export const XO_LINKS = {
  BLOG: 'https://xen-orchestra.com/blog/',
  COMMUNITY: 'https://xcp-ng.org/forum/category/12/xen-orchestra',
  DOC: 'https://docs.xen-orchestra.com',
  TRANSLATION: 'https://translate.vates.tech/engage/xen-orchestra/',
}

export const XCP_LINKS = {
  BLOG: 'https://xcp-ng.org/blog/',
  COMMUNITY: 'https://xcp-ng.org/forum',
  DOC: 'https://xcp-ng.org/docs/',
  SUPPORT: 'https://vates.tech/pricing-and-support?utm_campaign=xo6&utm_term=pricing',
  GUEST_TOOLS: 'https://docs.xcp-ng.org/vms/#guest-tools',
}

export const RULE_STATUS = {
  ALLOW: 'allow',
  DROP: 'drop',
} as const

export const ONE_GB = 1024 ** 3

export const VDI_SOURCE = {
  EMPTY: 'empty',
  FILE: 'file',
  URL: 'url',
} as const

export const VDI_EXPORT_FORMAT = {
  VHD: 'vhd',
  RAW: 'raw',
} as const

export type VdiExportFormat = (typeof VDI_EXPORT_FORMAT)[keyof typeof VDI_EXPORT_FORMAT]

export const VDI_PAGE_CONTEXT = {
  VM: 'vm',
  SR: 'sr',
  SNAPSHOT: 'snapshot',
  VDI_SNAPSHOT: 'vdi_snapshot',
} as const

export type VdiPageContext = (typeof VDI_PAGE_CONTEXT)[keyof typeof VDI_PAGE_CONTEXT]
