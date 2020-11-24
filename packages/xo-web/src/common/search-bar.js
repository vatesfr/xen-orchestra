import _ from 'intl'
import classNames from 'classnames'
import DropdownMenu from 'react-bootstrap-4/lib/DropdownMenu' // https://phabricator.babeljs.io/T6662 so Dropdown.Menu won't work like https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import DropdownToggle from 'react-bootstrap-4/lib/DropdownToggle' // https://phabricator.babeljs.io/T6662 so Dropdown.Toggle won't work https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Dropdown, MenuItem } from 'react-bootstrap-4/lib'
import { Input as DebouncedInput } from 'debounce-input-decorator'
import { isEmpty, map } from 'lodash'

import Button from './button'
import Icon from './icon'
import Tooltip from './tooltip'

export default class SearchBar extends Component {
  static propTypes = {
    filters: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
  }

  _cleanFilter = () => this._setFilter('')

  _setFilter = filterValue => {
    const filter = this.refs.filter.getWrappedInstance()
    filter.value = filterValue
    filter.focus()
    this.props.onChange(filterValue)
  }

  _onChange = event => {
    this.props.onChange(event.target.value)
  }

  focus() {
    this.refs.filter.getWrappedInstance().focus()
  }

  render() {
    const { props } = this

    return (
      <div className={classNames('input-group', props.className)}>
        {isEmpty(props.filters) ? (
          <span className='input-group-addon'>
            <Icon icon='search' />
          </span>
        ) : (
          <span className='input-group-btn'>
            <Dropdown id='filter'>
              <DropdownToggle bsStyle='info'>
                <Icon icon='search' />
              </DropdownToggle>
              <DropdownMenu>
                {map(props.filters, (filter, label) => (
                  <MenuItem key={label} onClick={() => this._setFilter(filter)}>
                    {_(label)}
                  </MenuItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </span>
        )}
        <DebouncedInput className='form-control' onChange={this._onChange} ref='filter' value={props.value} />
        <Tooltip content={_('filterSyntaxLinkTooltip')}>
          <a
            className='input-group-addon'
            href='https://xen-orchestra.com/docs/manage_infrastructure.html#live-filter-search'
            rel='noopener noreferrer'
            target='_blank'
          >
            <Icon icon='info' />
          </a>
        </Tooltip>
        <span className='input-group-btn'>
          <Button onClick={this._cleanFilter}>
            <Icon icon='clear-search' />
          </Button>
        </span>
      </div>
    )
  }
}
