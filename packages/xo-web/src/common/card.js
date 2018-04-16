import React from 'react'

import propTypes from './prop-types-decorator'

const CARD_STYLE = {
  minHeight: '100%',
}

const CARD_STYLE_WITH_SHADOW = {
  ...CARD_STYLE,
  boxShadow: '0 10px 6px -6px #777', // https://css-tricks.com/almanac/properties/b/box-shadow/
}

const CARD_HEADER_STYLE = {
  minHeight: '100%',
  textAlign: 'center',
}

export const Card = propTypes({
  shadow: propTypes.bool,
})(({ shadow, ...props }) => {
  props.className = 'card'
  props.style = {
    ...props.style,
    ...(shadow ? CARD_STYLE_WITH_SHADOW : CARD_STYLE),
  }

  return <div {...props} />
})

export const CardHeader = propTypes({
  className: propTypes.string,
})(({ children, className }) => (
  <h4 className={`card-header ${className || ''}`} style={CARD_HEADER_STYLE}>
    {children}
  </h4>
))

export const CardBlock = propTypes({
  className: propTypes.string,
})(({ children, className }) => (
  <div className={`card-block ${className || ''}`}>{children}</div>
))
