import React from 'react'
import { isEmpty } from 'lodash'

import propTypes from './prop-types-decorator'

const NoObjects = ({ children, className, collection, message, predicate }) => !predicate(collection)
  ? <h2 className={className}><img src='assets/loading.svg' /></h2>
  : isEmpty(collection)
    ? <p className={className}>{message}</p>
    : <div>{children}</div>

propTypes(NoObjects)({
  children: propTypes.node.isRequired,
  collection: propTypes.oneOfType([
    propTypes.array,
    propTypes.object
  ]).isRequired,
  message: propTypes.node.isRequired,
  className: propTypes.string,
  predicate: propTypes.func.isRequired
})
export default NoObjects
