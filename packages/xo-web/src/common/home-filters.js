const common = {
  homeFilterNone: '',
}

const VM = {
  ...common,
  homeFilterPendingVms: 'current_operations:"" ',
  homeFilterHvmGuests: 'virtualizationMode:hvm ',
}

const host = {
  ...common,
}

const pool = {
  ...common,
}

const vmTemplate = {
  ...common,
}

const SR = {
  ...common,
}

export default {
  VM,
  host,
  pool,
  'VM-template': vmTemplate,
  SR,
}
