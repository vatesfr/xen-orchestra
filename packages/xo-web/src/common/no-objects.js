import PropTypes from 'prop-types'
import React from 'react'
import isEmpty from 'lodash/isEmpty.js'

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

  const { children, component: Component, componentRef, ...otherProps } = props
  return children !== undefined ? children(otherProps) : <Component ref={componentRef} {...otherProps} />
}

NoObjects.propTypes = {
  children: PropTypes.func,
  collection: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  component: PropTypes.func,
  componentRef: PropTypes.func,
  emptyMessage: PropTypes.node.isRequired,
}
export { NoObjects as default }
