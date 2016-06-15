import assign from 'lodash/assign'
import { PropTypes } from 'react'

// Decorators to help declaring on React components without using the
// tedious static properties syntax.
//
// ```js
// @propTypes({
//   children: propTypes.node.isRequired
// })
// class MyComponent extends React.Component {}
// ```
const propTypes = types => target => {
  target.propTypes = {
    ...target.propTypes,
    ...types
  }

  return target
}
assign(propTypes, PropTypes)
export { propTypes as default }
