import React from 'react'
import { isEmpty } from 'lodash'

import propTypes from './prop-types-decorator'

// This component returns :
//  - A loading icon when the objects are not fetched
//  - A default message if the objects are fetched and the collection is empty
//  - The children if the objects are fetched and the collection is not empty
//
// ```js
//  <NoObjects collection={collection} message={message}>
//    {children}
// </NoObjects>
// ````
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
  message: propTypes.any
})
export default NoObjects
