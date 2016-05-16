import _ from 'messages'
import ActionButton from 'action-button'
import map from 'lodash/map'
import React from 'react'
import Tooltip from 'tooltip'
import {
  ButtonToolbar
} from 'react-bootstrap-4/lib'

const STYLE = {
  borderRadius: '15px',
  fontSize: '1.8em'
}

const ActionBar = ({ actions, param }) => (
  <ButtonToolbar>
    {map(actions, ({ handler, handlerParam = param, label, icon }, index) => (
      <Tooltip key={index} content={_(label)}>
        <ActionButton
          btnStyle='secondary'
          handler={handler}
          handlerParam={handlerParam}
          icon={icon}
          style={STYLE}
        />
      </Tooltip>
    ))}
  </ButtonToolbar>
)
ActionBar.propTypes = {
  actions: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      label: React.PropTypes.string.isRequired,
      icon: React.PropTypes.string.isRequired,
      handler: React.PropTypes.func
    })
  ).isRequired,
  display: React.PropTypes.oneOf(['icon', 'text', 'both'])
}
export { ActionBar as default }
