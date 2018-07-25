// TODO: remove these functions once the PR: https://github.com/julien-f/freactal/pull/5 has been merged
// It only supports native inputs
export const linkState = (_, { target }) => state => ({
  ...state,
  [target.name]:
    target.nodeName.toLowerCase() === 'input' &&
    target.type.toLowerCase() === 'checkbox'
      ? target.checked
      : target.value,
})

export const toggleState = (_, { target: { name } }) => state => ({
  ...state,
  [name]: !state[name],
})
