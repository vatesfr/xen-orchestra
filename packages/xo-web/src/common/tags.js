import _ from 'intl'
import filter from 'lodash/filter'
import includes from 'lodash/includes'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'
import pFinally from 'promise-toolbox/finally'
import PropTypes from 'prop-types'
import React from 'react'
import relativeLuminance from 'relative-luminance'
import { addSubscriptions, connectStore } from 'utils'
import { setTag, subscribeConfiguredTags } from 'xo'
import { Col, Container, Row } from 'grid'
import { isAdmin } from 'selectors'

import ActionButton from './action-button'
import Component from './base-component'
import Icon from './icon'
import Tooltip from './tooltip'
import { confirm } from './modal'
import { SelectTag } from './select-objects'

const noop = Function.prototype

const DEFAULT_TAG_COLOR = '#2598d9'

const INPUT_STYLE = {
  maxWidth: '8em',
}

const COL_INPUT_COLOR_STYLE = {
  margin: 'auto',
}

const ADD_TAG_STYLE = {
  cursor: 'pointer',
  display: 'inline-block',
  fontSize: '0.8em',
  marginLeft: '0.2em',
  verticalAlign: 'middle',
}

class AdvancedTagCreation extends Component {
  state = { tags: [], color: this.props.isAdmin ? DEFAULT_TAG_COLOR : undefined }

  get value() {
    return { ...this.state, tags: this.state.tags.map(_ => _.value) }
  }

  render() {
    return (
      <Container>
        <Row className='d-flex'>
          <Col size={6}>
            <SelectTag multi onChange={this.linkState('tags')} value={this.state.tags} />
          </Col>
          {this.props.isAdmin && (
            <Col size={6} style={COL_INPUT_COLOR_STYLE}>
              <input
                className='form-control'
                style={INPUT_STYLE}
                type='color'
                onChange={this.linkState('color')}
                value={this.state.color}
              />
            </Col>
          )}
        </Row>
      </Container>
    )
  }
}

@connectStore({
  isAdmin,
})
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

  _advancedTagCreation = () =>
    confirm({
      body: <AdvancedTagCreation isAdmin={this.props.isAdmin} />,
      icon: 'add',
      title: _('advancedTagCreation'),
    })
      ::pFinally(this._stopEdit)
      .then(({ tags, color }) =>
        Promise.all(
          tags.map(async tag => {
            await this._addTag(tag)
            return this.props.isAdmin ? setTag(tag, { color }) : noop()
          })
        )
      )

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
                <Tooltip content={_('advancedTagCreation')}>
                  <ActionButton handler={this._advancedTagCreation} icon='add' />
                </Tooltip>
              </span>
            </span>
          </div>
        )}
      </div>
    )
  }
}

@addSubscriptions({
  configuredTags: cb => subscribeConfiguredTags(tags => cb(keyBy(tags, 'id'))),
})
export class Tag extends Component {
  render() {
    const { label, onDelete, onClick, configuredTags } = this.props
    const color = configuredTags?.[label]?.color ?? DEFAULT_TAG_COLOR
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
}
Tag.propTypes = {
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
}
