import React from 'react'
import { map, noop } from 'lodash'

import _ from './intl'
import ActionButton from './action-button'
import ButtonGroup from './button-group'

const ActionBar = ({ actions, param, show }) => (
  <ButtonGroup>
    {map(actions, (button, index) => {
      if (show === false) {
        return
      }

      const {
        handler,
        handlerParam = param,
        icon,
        label,
        pending,
        redirectOnSuccess
      } = button
      return <ActionButton
        key={index}
        handler={handler || noop}
        handlerParam={handlerParam}
        icon={icon}
        pending={pending}
        redirectOnSuccess={redirectOnSuccess}
        size='large'
        tooltip={_(label)}
      />
    })}
  </ButtonGroup>
)
ActionBar.propTypes = {
  actions: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      label: React.PropTypes.string.isRequired,
      icon: React.PropTypes.string.isRequired,
      handler: React.PropTypes.func,
      redirectOnSuccess: React.PropTypes.string
    })
  ).isRequired,
  display: React.PropTypes.oneOf(['icon', 'text', 'both']),
  show: React.PropTypes.bool
}
export { ActionBar as default }
