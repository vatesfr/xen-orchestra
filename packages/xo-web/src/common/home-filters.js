const common = {
  homeFilterNone: '',
}

export const VM = {
  ...common,
  homeFilterPendingVms: 'current_operations:"" ',
  homeFilterHvmGuests: 'virtualizationMode:hvm ',
}

export const host = {
  ...common,
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
