import ActionButton from 'action-button'
import propTypes from 'prop-types-decorator'
import React, { cloneElement } from 'react'
import { noop } from 'lodash'

import ButtonGroup from './button-group'

export const Action = ({ label, icon, handler, redirectOnSuccess, display }) =>
  <ActionButton
    handler={handler}
    icon={icon}
    redirectOnSuccess={redirectOnSuccess}
    size='large'
    tooltip={display === 'icon' ? label : undefined}
  >
    {display === 'both' && label}
  </ActionButton>

Action.propTypes = {
  display: propTypes.oneOf([ 'icon', 'both' ]),
  handler: propTypes.func.isRequired,
  icon: propTypes.string.isRequired,
  label: propTypes.node,
  redirectOnSuccess: propTypes.string
}

const ActionBar = ({ children, param = noop, display = 'both' }) =>
  <ButtonGroup>
    {React.Children.map(children, (child, key) => {
      if (!child) {
        return
      }

      const { props } = child
      return cloneElement(child, {
        display: props.display || display,
        handlerParam: props.handlerParam || param,
        key
      })
    })}
  </ButtonGroup>

ActionBar.propTypes = {
  display: propTypes.oneOf([ 'icon', 'both' ])
}
export { ActionBar as default }
