import classNames from 'classnames'
import React from 'react'
import { propTypes } from 'utils'

export const Col = propTypes({
  className: propTypes.string,
  size: propTypes.number,
  smallSize: propTypes.number,
  mediumSize: propTypes.number,
  largeSize: propTypes.number,
  offset: propTypes.number,
  smallOffset: propTypes.number,
  mediumOffset: propTypes.number,
  largeOffset: propTypes.number
})(({
  children,
  className,
  size,
  smallSize = size,
  mediumSize,
  largeSize,
  offset,
  smallOffset = offset,
  mediumOffset,
  largeOffset
}) => <div className={classNames(
  className,
  smallSize && `col-xs-${smallSize}`,
  mediumSize && `col-md-${mediumSize}`,
  largeSize && `col-lg-${largeSize}`,
  smallOffset && `offset-xs-${smallOffset}`,
  mediumOffset && `offset-md-${mediumOffset}`,
  largeOffset && `offset-lg-${largeOffset}`
)}>
  {children}
</div>)

export const Row = propTypes({
  className: propTypes.string
})(({
  children,
  className
}) => <div className={`${className || ''} row`}>
  {children}
</div>)
