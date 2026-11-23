// One check of the precheck of a rolling pool update: it passes when it
// concerns no object. `liftedBy` is the option of the start which lifts a
// blocking check
export const rpuCheck = (id, result, objects, liftedBy) => ({
  id,
  result: objects.length === 0 ? 'passed' : result,
  ...(liftedBy !== undefined && objects.length > 0 && { liftedBy }),
  objects,
})
