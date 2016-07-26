import _ from 'intl'
import ActionButton from 'action-button'
import map from 'lodash/map'
import React from 'react'
import Tooltip from 'tooltip'
import {
  ButtonGroup
} from 'react-bootstrap-4/lib'

const ActionBar = ({ actions, param }) => (
  <ButtonGroup>
      {map(actions, ({ handler, handlerParam = param, label, icon }, index) => (
        <Tooltip key={index} content={_(label)}>
          <ActionButton
            key={index}
            btnStyle='secondary'
            handler={handler}
            handlerParam={handlerParam}
            icon={icon}
            size='large'
          />
        </Tooltip>
    ))}
  </ButtonGroup>
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
