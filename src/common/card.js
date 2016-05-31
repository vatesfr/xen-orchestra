import React from 'react'
import { propTypes } from 'utils'

const CARD_STYLE = {
  minHeight: '100%'
}

const CARD_HEADER_STYLE = {
  minHeight: '100%',
  fontSize: '1.2em',
  textAlign: 'center'
}

export const Card = propTypes({
  disableMaxHeight: propTypes.bool
})(({
  children
}) => (
  <div className='card' style={CARD_STYLE}>
    {children}
  </div>
))

export const CardHeader = propTypes({
  className: propTypes.string
})(({
  children,
  className
}) => (
  <div className={`card-header ${className || ''}`} style={CARD_HEADER_STYLE}>
    {children}
  </div>
))

export const CardBlock = propTypes({
  className: propTypes.string
})(({
  children,
  className
}) => (
  <div className={`card-block ${className || ''}`}>
    {children}
  </div>
))
