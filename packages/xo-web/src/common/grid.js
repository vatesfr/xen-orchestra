import classNames from 'classnames'
import React from 'react'

import propTypes from './prop-types-decorator'

// A column can contain content or a row.
export const Col = propTypes({
  className: propTypes.string,
  size: propTypes.number,
  smallSize: propTypes.number,
  mediumSize: propTypes.number,
  largeSize: propTypes.number,
  offset: propTypes.number,
  smallOffset: propTypes.number,
  mediumOffset: propTypes.number,
  largeOffset: propTypes.number,
})(
  ({
    children,
    className,
    size = 12,
    smallSize = size,
    mediumSize,
    largeSize,
    offset,
    smallOffset = offset,
    mediumOffset,
    largeOffset,
    style,
  }) => (
    <div
      className={classNames(
        className,
        smallSize && `col-xs-${smallSize}`,
        mediumSize && `col-md-${mediumSize}`,
        largeSize && `col-lg-${largeSize}`,
        smallOffset && `offset-xs-${smallOffset}`,
        mediumOffset && `offset-md-${mediumOffset}`,
        largeOffset && `offset-lg-${largeOffset}`
      )}
      style={style}
    >
      {children}
    </div>
  )
)

// This is the root component of the grid layout, containers should not be
// nested.
export const Container = propTypes({
  className: propTypes.string,
})(({ children, className }) => (
  <div className={classNames(className, 'container-fluid')}>{children}</div>
))

// Only columns can be children of a row.
export const Row = propTypes({
  className: propTypes.string,
  marginBottom: propTypes.number,
})(({ children, className, marginBottom }) => (
  <div
    className={classNames(
      `${className || ''} row`,
      marginBottom && `mb-${marginBottom}`
    )}
  >
    {children}
  </div>
))
