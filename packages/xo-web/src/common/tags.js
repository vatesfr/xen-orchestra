import _ from 'intl'
import filter from 'lodash/filter'
import includes from 'lodash/includes'
import map from 'lodash/map'
import pFinally from 'promise-toolbox/finally'
import PropTypes from 'prop-types'
import React from 'react'

import ActionButton from './action-button'
import Component from './base-component'
import Icon from './icon'
import Tooltip from './tooltip'
import { confirm } from './modal'
import { SelectTag } from './select-objects'

const INPUT_STYLE = {
  maxWidth: '8em',
}
const TAG_STYLE = {
  borderRadius: '0.5em',
  border: '0.2em solid #2598d9',
  backgroundColor: '#2598d9',
  color: 'white',
  fontSize: '0.6em',
  margin: '0.2em',
  marginTop: '-0.1em',
  verticalAlign: 'middle',
}
const LINK_STYLE = {
  cursor: 'pointer',
}
const TAG_STYLE_ONCLICK = {
  ...TAG_STYLE,
  ...LINK_STYLE,
}

const ADD_TAG_STYLE = {
  cursor: 'pointer',
  fontSize: '0.8em',
  marginLeft: '0.2em',
}
const REMOVE_TAG_STYLE = {
  cursor: 'pointer',
}

const TAG_SCOPE_STYLE = {
  padding: '0.1em',

  borderRadius: '0.2em',
}
const TAG_SCOPE_LINK_STYLE = {
  ...TAG_SCOPE_STYLE,
  ...LINK_STYLE,
}
const TAG_SCOPE_VALUE_STYLE = {
  padding: '0 0.2em',
  color: '#2598d9',
  backgroundColor: 'white',
  borderTopRightRadius: '0.3em', // tag border radius - tag padding
  borderBottomRightRadius: '0.3em', // tag border radius - tag padding
}

class SelectExistingTag extends Component {
  state = { tags: [] }

  get value() {
    return this.state.tags.map(_ => _.value)
  }

  render() {
    return <SelectTag multi onChange={this.linkState('tags')} value={this.state.tags} />
  }
}

export default class Tags extends Component {
  static propTypes = {
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    onAdd: PropTypes.func,
    onChange: PropTypes.func,
    onClick: PropTypes.func,
    onDelete: PropTypes.func,
  }

  componentWillMount() {
    this.setState({ editing: false })
  }

  _startEdit = () => {
    this.setState({ editing: true })
  }
  _stopEdit = () => {
    this.setState({ editing: false })
  }

  _addTag = newTag => {
    const { labels, onAdd, onChange } = this.props

    if (!includes(labels, newTag)) {
      onAdd && onAdd(newTag)
      onChange && onChange([...labels, newTag])
    }
  }
  _deleteTag = tag => {
    const { onChange, onDelete } = this.props

    onDelete && onDelete(tag)
    onChange && onChange(filter(this.props.labels, t => t !== tag))
  }

  _onKeyDown = event => {
    const { keyCode, target } = event

    if (keyCode === 13) {
      if (target.value) {
        this._addTag(target.value)
        target.value = ''
      }
    } else if (keyCode === 27) {
      this._stopEdit()
    } else {
      return
    }

    event.preventDefault()
  }

  _selectExistingTags = () =>
    confirm({
      body: <SelectExistingTag />,
      icon: 'add',
      title: _('selectExistingTags'),
    })
      ::pFinally(this._stopEdit)
      .then(tags => Promise.all(tags.map(this._addTag)))

  _focus = () => {
    this._focused = true
  }

  _closeEditionIfUnfocused = () => {
    this._focused = false
    setTimeout(() => {
      !this._focused && this._stopEdit()
    }, 10)
  }

  render() {
    const { labels, onAdd, onChange, onClick, onDelete } = this.props

    const deleteTag = (onDelete || onChange) && this._deleteTag

    return (
      <span className='form-group' style={{ color: '#999' }}>
        <Icon icon='tags' />{' '}
        <span>
          {map(labels.sort(), (label, index) => (
            <Tag label={label} onDelete={deleteTag} key={index} onClick={onClick} />
          ))}
        </span>
        {(onAdd || onChange) && !this.state.editing ? (
          <span onClick={this._startEdit} style={ADD_TAG_STYLE}>
            <Icon icon='add-tag' />
          </span>
        ) : (
          <span className='form-inline' onBlur={this._closeEditionIfUnfocused} onFocus={this._focus}>
            <span className='input-group'>
              <input autoFocus className='form-control' onKeyDown={this._onKeyDown} style={INPUT_STYLE} type='text' />
              <span className='input-group-btn'>
                <Tooltip content={_('selectExistingTags')}>
                  <ActionButton handler={this._selectExistingTags} icon='add' />
                </Tooltip>
              </span>
            </span>
          </span>
        )}
      </span>
    )
  }
}

const ScopedTag = ({ type, label, scope, value, onDelete, onClick }) => {
  return (
    <span style={onClick ? TAG_STYLE_ONCLICK : TAG_STYLE}>
      <span style={onClick ? TAG_SCOPE_LINK_STYLE : TAG_SCOPE_STYLE} onClick={onClick && (() => onClick(label))}>
        {scope}
      </span>
      <span style={TAG_SCOPE_VALUE_STYLE}>
        <span onClick={onClick && (() => onClick(label))} style={onClick && LINK_STYLE}>
          {value}
        </span>{' '}
        {onDelete && (
          <span onClick={onDelete && (() => onDelete(label))} style={REMOVE_TAG_STYLE}>
            <Icon icon='remove-tag' />
          </span>
        )}
      </span>
    </span>
  )
}

ScopedTag.propTypes = {
  scope: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
}

export const Tag = ({ type, label, onDelete, onClick }) => {
  const [scope, ...values] = label.split('=')
  if (scope && values?.length > 0) {
    return <ScopedTag {...{ type, label, scope, value: values.join('='), onDelete, onClick }} />
  }
  return (
    <span style={TAG_STYLE}>
      <span onClick={onClick && (() => onClick(label))} style={onClick && LINK_STYLE}>
        {label}
      </span>{' '}
      {onDelete ? (
        <span onClick={onDelete && (() => onDelete(label))} style={REMOVE_TAG_STYLE}>
          <Icon icon='remove-tag' />
        </span>
      ) : (
        []
      )}
    </span>
  )
}
Tag.propTypes = {
  label: PropTypes.string.isRequired,
}
