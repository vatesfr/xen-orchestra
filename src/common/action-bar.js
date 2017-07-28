import _ from 'intl'
import ActionButton from 'action-button'
import React, { cloneElement } from 'react'
import { noop } from 'lodash'

import ButtonGroup from './button-group'

export const Action = ({ label, icon, handler, redirectOnSuccess, display }) =>
  <ActionButton
    handler={handler}
    icon={icon}
    redirectOnSuccess={redirectOnSuccess}
    size='large'
    tooltip={display === 'icon' ? _(label) : undefined}
  >
    {display === 'both' && _(label)}
  </ActionButton>

Action.propTypes = {
  display: React.PropTypes.oneOf([ 'icon', 'both' ]),
  handler: React.PropTypes.func.isRequired,
  icon: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
  redirectOnSuccess: React.PropTypes.string
}

const ActionBar = ({ children, param = noop, display = 'both' }) =>
  <ButtonGroup>
    {React.Children.map(children, (child, key) => {
      if (child == null) {
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
  display: React.PropTypes.oneOf([ 'icon', 'both' ])
}
export { ActionBar as default }
