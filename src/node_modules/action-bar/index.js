import _ from 'messages'
import map from 'lodash/map'
import React from 'react'
import Icon from 'icon'
import {
  Button,
  DropdownButton,
  ButtonGroup,
  ButtonToolbar,
  MenuItem
} from 'react-bootstrap-4/lib'

const ActionBar = ({ style, actions, display = 'text' }) => (
  <ButtonToolbar style={style}>
    {map(actions, (action, index) =>
      !action.dropdownItems
      ? <Button bsStyle='secondary' key={index} onClick={() => action.handler()}>
        <Content key={index} display={display} label={action.label} icon={action.icon} />
      </Button>
      : <ButtonGroup bsStyle='secondary' pullRight key={index}>
        <Button bsStyle='secondary' style={{paddingLeft: '0.7em', paddingRight: '0.5em'}}>
          <Content key={index} display={display} label={action.label} icon={action.icon} />
        </Button>
        <DropdownButton
          key={index}
          id={`dropdown-${index}`}
          pullRight
          bsStyle='secondary'
          style={{paddingLeft: '0px', paddingRight: '0px', width: '1.3em'}}
          title=''
        >
          {map(action.dropdownItems, ({label, icon, handler}, index) => (
            <MenuItem key={index} eventKey={index}>
              <Content key={index} display='both' label={label} icon={icon} />
            </MenuItem>
          ))}
        </DropdownButton>
      </ButtonGroup>
    )}
  </ButtonToolbar>
)
ActionBar.propTypes = {
  actions: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      label: React.PropTypes.string.isRequired,
      icon: React.PropTypes.string.isRequired,
      handler: React.PropTypes.func,
      dropdownItems: React.PropTypes.array
    })
  ).isRequired,
  display: React.PropTypes.oneOf(['icon', 'text', 'both'])
}
export default ActionBar

const Content = ({display, icon, label}) => (
  <span>
    {icon && (display === 'icon' || display === 'both') ? <Icon icon={icon} /> : null}
    {display === 'both' && <span>&nbsp;&nbsp;</span>}
    {label && (display === 'text' || display === 'both') ? _(label) : null}
  </span>
)
