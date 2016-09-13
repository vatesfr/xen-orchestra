import includes from 'lodash/includes'
import map from 'lodash/map'
import React from 'react'
import remove from 'lodash/remove'

import Component from './base-component'
import Icon from './icon'
import propTypes from './prop-types'

const POINTER = { cursor: 'pointer' }
const INPUT_STYLE = { maxWidth: '4em', margin: '2px' }

@propTypes({
  labels: propTypes.arrayOf(React.PropTypes.string).isRequired,
  onChange: propTypes.func,
  onDelete: propTypes.func,
  onAdd: propTypes.func
})
export default class Tags extends Component {
  componentWillMount () {
    this.setState({editing: false})
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
      onChange && onChange([ ...labels, newTag ])
    }
  }
  _deleteTag = tag => {
    if (!includes(this.props.labels, tag)) {
      return
    }

    const labels = [ ...this.props.labels ]
    const { onChange, onDelete } = this.props

    remove(labels, t => t === tag)

    onDelete && onDelete(tag)
    onChange && onChange(labels)
  }

  render () {
    const {
      labels,
      onAdd,
      onChange,
      onDelete
    } = this.props

    return (
      <span className='form-group' style={{ color: '#999' }}>
        <Icon icon='tags' />
        {' '}
        <span>
          {map(labels.sort(), (label, index) =>
            <Tag label={label} onDelete={(onDelete || onChange) && this._deleteTag} key={index} />
          )}
        </span>
        {(onAdd || onChange) && !this.state.editing
          ? <span className='add-tag-action' onClick={this._startEdit} style={POINTER}>
            <Icon icon='add-tag' />
          </span>
          : <span>
            <input
              type='text'
              autoFocus
              style={INPUT_STYLE}
              onKeyDown={event => {
                const { keyCode, target } = event

                if (keyCode === 13 || keyCode === 27) {
                  event.preventDefault()
                }

                if (keyCode === 13 && target.value) {
                  this._addTag(target.value)
                  target.value = ''
                } else if (keyCode === 27) {
                  this._stopEdit()
                }
              }}
              onBlur={this._stopEdit}
            />
          </span>
        }
      </span>
    )
  }
}

export const Tag = ({ label, onDelete }) => (
  <span className='xo-tag'>
    {label}{' '}
    {onDelete
      ? <span onClick={onDelete && (() => onDelete(label))} style={POINTER}>
        <Icon icon='remove-tag' />
      </span>
      : []
    }
  </span>
)
Tag.propTypes = {
  label: React.PropTypes.string.isRequired
}
