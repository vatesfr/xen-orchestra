const common = {
  homeFilterNone: '',
}

export const VM = {
  ...common,
  homeFilterPendingVms: 'current_operations:"" ',
  homeFilterNonRunningVms: '!power_state:running ',
  homeFilterHvmGuests: 'virtualizationMode:hvm ',
  homeFilterRunningVms: 'power_state:running ',
}

export const host = {
  ...common,
  homeFilterRunningHosts: 'power_state:running ',
}

export const pool = {
  ...common,
}

export const vmTemplate = {
  ...common,
}

export const SR = {
  ...common,
}
