export const VM = {
  homeFilterPendingVms: 'current_operations:"" ',
  homeFilterNonRunningVms: '!power_state:running ',
  homeFilterHvmGuests: 'virtualizationMode:hvm ',
  homeFilterRunningVms: 'power_state:running ',
  homeFilterTags: 'tags:'
}

export const host = {
  homeFilterRunningHosts: 'power_state:running ',
  homeFilterTags: 'tags:'
}

export const pool = {
  homeFilterTags: 'tags:'
}

export const template = {
  homeFilterTags: 'tags:'
}
