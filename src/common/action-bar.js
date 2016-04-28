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

const ActionBar = ({ actions, display = 'text' }) => (
  <ButtonToolbar>
    {map(actions, (action, index) =>
      !action.dropdownItems
      ? <Button bsStyle='secondary' key={index} onClick={() => action.handler()} style={{width: '2.3em', 'font-size': '1.8em', 'border-radius': '20px'}}>
        <Content key={index} display={display} label={action.label} icon={action.icon} />
      </Button>
      : <ButtonGroup bsStyle='secondary' pullRight key={index}>
        <DropdownButton
          key={index}
          id={`dropdown-${index}`}
          pullRight
          bsStyle='secondary'
          onClick={() => action.handler()}
          noCaret
          style={{width: '2.3em', 'font-size': '1.8em', 'border-radius': '20px'}}
          title={<Content display={display} label={action.label} icon={action.icon} />}
        >
          <MenuItem key={index} eventKey={index} onClick={action.handler}>
            <Content key={index} display='both' label={action.label} icon={action.icon} main />
          </MenuItem>
          {map(action.dropdownItems, ({label, icon, handler}, index) => (
            <MenuItem key={index} eventKey={index} onClick={handler}>
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

const Content = ({display, icon, label, main}) => (
  <span style={{fontWeight: main && 'bold'}}>
    {icon && (display === 'icon' || display === 'both') ? <Icon icon={icon} /> : null}
    {display === 'both' && <span>&nbsp;&nbsp;</span>}
    {label && (display === 'text' || display === 'both') ? _(label) : null}
  </span>
)
