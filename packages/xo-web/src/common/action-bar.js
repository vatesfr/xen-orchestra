import ActionButton from 'action-button'
import PropTypes from 'prop-types'
import React, { cloneElement } from 'react'
import noop from 'lodash/noop.js'

import ButtonGroup from './button-group'

export const Action = ({ display, handler, handlerParam, icon, label, pending, redirectOnSuccess }) => (
  <ActionButton
    handler={handler}
    handlerParam={handlerParam}
    icon={icon}
    pending={pending}
    redirectOnSuccess={redirectOnSuccess}
    size='large'
    tooltip={display === 'icon' ? label : undefined}
  >
    {display === 'both' && label}
  </ActionButton>
)

Action.propTypes = {
  display: PropTypes.oneOf(['icon', 'both']),
  handler: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.node,
  pending: PropTypes.bool,
  redirectOnSuccess: PropTypes.string,
}

const ActionBar = ({ children, handlerParam = noop, display = 'both' }) => (
  <ButtonGroup>
    {React.Children.map(children, (child, key) => {
      if (!child) {
        return
      }

      const { props } = child
      return cloneElement(child, {
        display: props.display || display,
        handlerParam: props.handlerParam || handlerParam,
        key,
      })
    })}
  </ButtonGroup>
)

ActionBar.propTypes = {
  display: PropTypes.oneOf(['icon', 'both']),
  handlerParam: PropTypes.any,
}
export { ActionBar as default }
