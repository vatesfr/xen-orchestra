const common = {
  homeFilterNone: ''
}

export const VM = {
  ...common,
  homeFilterPendingVms: 'current_operations:"" ',
  homeFilterNonRunningVms: '!power_state:running ',
  homeFilterHvmGuests: 'virtualizationMode:hvm ',
  homeFilterRunningVms: 'power_state:running ',
  homeFilterTags: 'tags:'
}

export const host = {
  ...common,
  homeFilterRunningHosts: 'power_state:running ',
  homeFilterTags: 'tags:'
}

export const pool = {
  ...common,
  homeFilterTags: 'tags:'
}

export const vmTemplate = {
  ...common,
  homeFilterTags: 'tags:'
}

export const SR = {
  ...common,
  homeFilterTags: 'tags:'
}
