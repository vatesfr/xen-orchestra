const PREFIX = 'OpaqueRef:'

export default value => typeof value === 'string' && value.startsWith(PREFIX)
