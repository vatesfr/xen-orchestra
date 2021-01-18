import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'

// A column can contain content or a row.
export const Col = ({
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

Col.propTypes = {
  className: PropTypes.string,
  size: PropTypes.number,
  smallSize: PropTypes.number,
  mediumSize: PropTypes.number,
  largeSize: PropTypes.number,
  offset: PropTypes.number,
  smallOffset: PropTypes.number,
  mediumOffset: PropTypes.number,
  largeOffset: PropTypes.number,
}

// This is the root component of the grid layout, containers should not be
// nested.
export const Container = ({ children, className }) => (
  <div className={classNames(className, 'container-fluid')}>{children}</div>
)

Container.propTypes = {
  className: PropTypes.string,
}

// Only columns can be children of a row.
export const Row = ({ children, className }) => <div className={`${className || ''} row`}>{children}</div>

Row.propTypes = {
  className: PropTypes.string,
}
