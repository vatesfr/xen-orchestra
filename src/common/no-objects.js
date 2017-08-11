import React from 'react'
import { isEmpty } from 'lodash'

import propTypes from './prop-types-decorator'

const NoObjects = ({ children, collection, message }) => collection == null
  ? <img src='assets/loading.svg' alt='loading' />
  : isEmpty(collection)
    ? <p>{message}</p>
    : <div>{children}</div>

propTypes(NoObjects)({
  children: propTypes.node.isRequired,
  collection: propTypes.oneOfType([
    propTypes.array,
    propTypes.object
  ]).isRequired,
  message: propTypes.node
})
export default NoObjects
