import ActionButton from 'action-button'
import propTypes from 'prop-types-decorator'
import React, { cloneElement } from 'react'
import { noop } from 'lodash'

import ButtonGroup from './button-group'

export const Action = ({display, handler, handlerParam, icon, label, redirectOnSuccess}) =>
  <ActionButton
    handler={handler}
    handlerParam={handlerParam}
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

const ActionBar = ({ children, handlerParam = noop, display = 'both' }) =>
  <ButtonGroup>
    {React.Children.map(children, (child, key) => {
      if (!child) {
        return
      }

      const { props } = child
      return cloneElement(child, {
        display: props.display || display,
        handlerParam: props.handlerParam || handlerParam,
        key
      })
    })}
  </ButtonGroup>

ActionBar.propTypes = {
  display: propTypes.oneOf([ 'icon', 'both' ]),
  handlerParam: propTypes.any
}
export { ActionBar as default }
