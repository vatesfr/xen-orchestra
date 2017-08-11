import React from 'react'
import { isEmpty } from 'lodash'

import propTypes from './prop-types-decorator'

// This component returns :
//  - A loading icon when the objects are not fetched
//  - A default message if the objects are fetched and the collection is empty
//  - The children if the objects are fetched and the collection is not empty
//
// ```js
//  <NoObjects collection={collection} emptyMessage={message}>
//    {children}
// </NoObjects>
// ````
const NoObjects = ({ children, collection, emptyMessage }) => collection == null
  ? <img src='assets/loading.svg' alt='loading' />
  : isEmpty(collection)
    ? <p>{emptyMessage}</p>
    : <div>{children}</div>

propTypes(NoObjects)({
  children: propTypes.node.isRequired,
  collection: propTypes.oneOfType([
    propTypes.array,
    propTypes.object
  ]).isRequired,
  emptyMessage: propTypes.node.isRequired
})
export default NoObjects
