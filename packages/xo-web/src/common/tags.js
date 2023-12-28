import _ from 'intl'
import filter from 'lodash/filter'
import includes from 'lodash/includes'
import map from 'lodash/map'
import pFinally from 'promise-toolbox/finally'
import PropTypes from 'prop-types'
import React from 'react'
import relativeLuminance from 'relative-luminance'

import ActionButton from './action-button'
import Component from './base-component'
import Icon from './icon'
import Tooltip from './tooltip'
import { confirm } from './modal'
import { SelectTag } from './select-objects'

const INPUT_STYLE = {
  maxWidth: '8em',
}
const ADD_TAG_STYLE = {
  cursor: 'pointer',
  display: 'inline-block',
  fontSize: '0.8em',
  marginLeft: '0.2em',
  verticalAlign: 'middle',
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
      <div style={{ color: '#999', display: 'inline-block' }}>
        <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <Icon icon='tags' />
        </div>
        <div style={{ display: 'inline-block', fontSize: '0.6em', verticalAlign: 'middle' }}>
          {map(labels.sort(), (label, index) => (
            <Tag label={label} onDelete={deleteTag} key={index} onClick={onClick} />
          ))}
        </div>
        {(onAdd || onChange) && !this.state.editing ? (
          <div onClick={this._startEdit} style={ADD_TAG_STYLE}>
            <Icon icon='add-tag' />
          </div>
        ) : (
          <div
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
            className='form-inline'
            onBlur={this._closeEditionIfUnfocused}
            onFocus={this._focus}
          >
            <span className='input-group'>
              <input autoFocus className='form-control' onKeyDown={this._onKeyDown} style={INPUT_STYLE} type='text' />
              <span className='input-group-btn'>
                <Tooltip content={_('selectExistingTags')}>
                  <ActionButton handler={this._selectExistingTags} icon='add' />
                </Tooltip>
              </span>
            </span>
          </div>
        )}
      </div>
    )
  }
}

export const Tag = ({
  type,
  label,
  onDelete,
  onClick,

  // must be in format #rrggbb for luminance parsing
  color = '#2598d9',
}) => {
  const borderSize = '0.2em'
  const padding = '0.2em'

  const isLight =
    relativeLuminance(
      Array.from({ length: 3 }, (_, i) => {
        const j = i * 2 + 1
        return parseInt(color.slice(j, j + 2), 16)
      })
    ) > 0.5

  const i = label.indexOf('=')
  const isScoped = i !== -1

  return (
    <div
      style={{
        background: color,
        border: borderSize + ' solid ' + color,
        borderRadius: '0.5em',
        color: isLight ? '#000' : '#fff',
        display: 'inline-block',
        margin: '0.2em',

        // prevent value background from breaking border radius
        overflow: 'clip',
      }}
    >
      <div
        onClick={onClick && (() => onClick(label))}
        style={{
          cursor: onClick && 'pointer',
          display: 'inline-block',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding,
          }}
        >
          {isScoped ? label.slice(0, i) : label}
        </div>
        {isScoped && (
          <div
            style={{
              background: '#fff',
              color: '#000',
              display: 'inline-block',
              padding,
            }}
          >
            {label.slice(i + 1) || <i>N/A</i>}
          </div>
        )}
      </div>
      {onDelete && (
        <div
          onClick={onDelete && (() => onDelete(label))}
          style={{
            cursor: 'pointer',
            display: 'inline-block',
            padding,

            // if isScoped, the display is a bit different
            background: isScoped && '#fff',
            color: isScoped && (isLight ? '#000' : color),
          }}
        >
          <Icon icon='remove-tag' />
        </div>
      )}
    </div>
  )
}
Tag.propTypes = {
  label: PropTypes.string.isRequired,
}
