import React from 'react'
import { routerShape } from 'react-router/lib/PropTypes'
import PropTypes from 'prop-types'

import Button from './button'

const ButtonLink = ({ to, ...props }, { router }) => {
  props.onClick = () => {
    router.push(to)
  }

  return <Button {...props} />
}

ButtonLink.contextTypes = {
  router: routerShape,
}

ButtonLink.propTypes = {
  to: PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.string]),
}

export { ButtonLink as default }
