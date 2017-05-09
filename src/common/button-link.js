import React from 'react'
import { routerShape } from 'react-router/lib/PropTypes'

import Button from './button'
import propTypes from './prop-types'

const ButtonLink = ({ to, ...props }, { router }) => {
  props.onClick = () => {
    router.push(to)
  }

  return <Button {...props} />
}

propTypes(
  {
    to: propTypes.oneOfType([
      propTypes.func,
      propTypes.object,
      propTypes.string,
    ]),
  },
  {
    router: routerShape,
  }
)(ButtonLink)

export { ButtonLink as default }
