import React from 'react'
import PropTypes from 'prop-types'

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

export const Card = ({ shadow, ...props }) => {
  props.className = 'card'
  props.style = {
    ...props.style,
    ...(shadow ? CARD_STYLE_WITH_SHADOW : CARD_STYLE),
  }

  return <div {...props} />
}

Card.propTypes = {
  shadow: PropTypes.bool,
}

export const CardHeader = ({ children, className }) => (
  <h4 className={`card-header ${className || ''}`} style={CARD_HEADER_STYLE}>
    {children}
  </h4>
)

CardHeader.propTypes = {
  className: PropTypes.string,
}

export const CardBlock = ({ children, className }) => <div className={`card-block ${className || ''}`}>{children}</div>

CardBlock.propTypes = {
  className: PropTypes.string,
}
