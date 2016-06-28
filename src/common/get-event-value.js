// If the param is an event, returns the value of it's target,
// otherwise returns the param.
const getEventValue = event => event && event.target
  ? event.target.value
  : event

export { getEventValue as default }
