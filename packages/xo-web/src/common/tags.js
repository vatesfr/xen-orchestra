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
import Button from './button'
import Component from './base-component'
import getEventValue from './get-event-value'
import Icon from './icon'
import Tooltip from './tooltip'
import { confirm } from './modal'
import { SelectTag } from './select-objects'

const noop = Function.prototype

const DEFAULT_TAG_COLOR = '#2598d9'

const INPUT_STYLE = {
  maxWidth: '8em',
  margin: 'auto',
}

const MARGIN_AUTO = {
  margin: 'auto',
}

const INHERIT_STYLE = {
  display: 'inherit',
  width: 'inherit',
}

const ADD_TAG_STYLE = {
  cursor: 'pointer',
  display: 'inline-block',
  fontSize: '0.8em',
  marginLeft: '0.2em',
  verticalAlign: 'middle',
}

const Fragment = ({ children }) => <div style={INHERIT_STYLE}>{children}</div>

class AdvancedTagCreation extends Component {
  state = {
    tags: this.props.defaultTags.map(tag => ({ id: tag, value: tag })),
    tagConfigurations: this.props.tagConfigurations ?? {},
  }

  get value() {
    return { ...this.state, tags: this.state.tags.map(_ => _.value) }
  }

  onChangeTagConfiguration(tagId, key, value) {
    this.setState({
      tagConfigurations: {
        ...this.state.tagConfigurations,
        [tagId]: {
          ...this.state.tagConfigurations[tagId],
          [key]: value,
        },
      },
    })
  }

  render() {
    return (
      <Container>
        <Row className='d-flex'>
          <Col>
            <SelectTag multi onChange={this.linkState('tags')} value={this.state.tags} />
          </Col>
        </Row>
        {this.props.isAdmin && (
          <ul className='list-group'>
            {this.state.tags.map(tag => {
              const _onAddTagColor = () => this.onChangeTagConfiguration(tag.id, 'color', DEFAULT_TAG_COLOR)
              const _onRemoveTagColor = () => this.onChangeTagConfiguration(tag.id, 'color', null)
              const _onChangeTagColor = event => this.onChangeTagConfiguration(tag.id, 'color', getEventValue(event))

              const tagConfiguration = this.state.tagConfigurations[tag.id]
              return (
                <li className='list-group-item' key={tag.id}>
                  <Container>
                    <Row className='d-flex'>
                      <Col style={MARGIN_AUTO}>{tag.value}</Col>
                      <Col className='d-flex justify-content-end'>
                        {tagConfiguration?.color == null ? (
                          <Button onClick={_onAddTagColor} size='small'>
                            {_('addColor')}
                          </Button>
                        ) : (
                          <Fragment>
                            <input
                              className='form-control mr-1'
                              style={INPUT_STYLE}
                              type='color'
                              onChange={_onChangeTagColor}
                              value={tagConfiguration.color}
                            />
                            <Button onClick={_onRemoveTagColor} size='small'>
                              {_('removeColor')}
                            </Button>
                          </Fragment>
                        )}
                      </Col>
                    </Row>
                  </Container>
                </li>
              )
            })}
          </ul>
        )}
      </Container>
    )
  }
}

@addSubscriptions({
  configuredTags: cb => subscribeConfiguredTags(tags => cb(keyBy(tags, 'id'))),
})
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
      body: (
        <AdvancedTagCreation
          isAdmin={this.props.isAdmin}
          tagConfigurations={this.props.configuredTags}
          defaultTags={this.props.labels}
        />
      ),
      icon: 'add',
      title: _('advancedTagCreation'),
    })
      ::pFinally(this._stopEdit)
      .then(({ tags, tagConfigurations }) =>
        Promise.all(
          tags.map(async tag => {
            await this._addTag(tag)
            const tagConfiguration = tagConfigurations[tag]
            return this.props.isAdmin && tagConfiguration !== undefined ? setTag(tag, tagConfiguration) : noop()
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

const TAG_TO_MESSAGE_ID = {
  'xo:no-bak': 'tagNoBak',
  'xo:notify-on-snapshot': 'tagNotifyOnSnapshot',
  'xo:no-health-check': 'tagNoHealthCheck',
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

    const scope = isScoped ? label.slice(0, i) : label
    const reason = isScoped ? label.slice(i + 1) : null

    const messageId = TAG_TO_MESSAGE_ID[scope]

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
        {messageId && (
          <div
            style={{
              cursor: 'help',
              display: 'inline-block',
              padding,
            }}
          >
            <Tooltip content={_(messageId, { reason })}>
              <Icon icon='info' />
            </Tooltip>
          </div>
        )}
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
            {scope}
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
              {reason || <i>N/A</i>}
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
