import assign from 'lodash/assign'
import { PropTypes } from 'react'

// Decorators to help declaring properties and context types on React
// components without using the tedious static properties syntax.
//
// ```js
// @propTypes({
//   children: propTypes.node.isRequired
// }, {
//   store: propTypes.object.isRequired
// })
// class MyComponent extends React.Component {}
// ```
const propTypes = (propTypes, contextTypes) => target => {
  if (propTypes !== undefined) {
    target.propTypes = {
      ...target.propTypes,
      ...propTypes,
    }
  }
  if (contextTypes !== undefined) {
    target.contextTypes = {
      ...target.contextTypes,
      ...contextTypes,
    }
  }

  return target
}
assign(propTypes, PropTypes)

export { propTypes as default }
