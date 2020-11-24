// If the param is an event, returns the value of it's target,
// otherwise returns the param.
const getEventValue = event => {
  let target
  if (!event || !(target = event.target)) {
    return event
  }

  return target.nodeName.toLowerCase() === 'input' && target.type.toLowerCase() === 'checkbox'
    ? target.checked
    : target.value
}

export { getEventValue as default }
