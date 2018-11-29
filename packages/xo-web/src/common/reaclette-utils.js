// TODO: remove these functions once the PR: https://github.com/JsCommunity/reaclette/pull/5 has been merged
// It only supports native inputs
export const linkState = (_, { target }) => () => ({
  [target.name]:
    target.nodeName.toLowerCase() === 'input' &&
    target.type.toLowerCase() === 'checkbox'
      ? target.checked
      : target.value,
})

export const toggleState = (_, { currentTarget: { name } }) => state => ({
  [name]: !state[name],
})
