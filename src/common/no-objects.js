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
const NoObjects = props => {
  const { collection } = props

  if (collection == null) {
    return <img src='assets/loading.svg' alt='loading' />
  }

  if (isEmpty(collection)) {
    return <p>{props.emptyMessage}</p>
  }

  const { children, component: Component, ...otherProps } = props
  return children !== undefined ? (
    children(otherProps)
  ) : (
    <Component {...otherProps} />
  )
}

propTypes(NoObjects)({
  children: propTypes.func,
  collection: propTypes.oneOfType([propTypes.array, propTypes.object]),
  component: propTypes.func,
  emptyMessage: propTypes.node.isRequired,
})
export default NoObjects
