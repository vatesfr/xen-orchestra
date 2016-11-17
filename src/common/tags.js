import filter from 'lodash/filter'
import includes from 'lodash/includes'
import map from 'lodash/map'
import React from 'react'

import Component from './base-component'
import Icon from './icon'
import Link from './link'
import propTypes from './prop-types'
import { createString, createProperty, toString } from './complex-matcher'

const INPUT_STYLE = {
  margin: '2px',
  maxWidth: '4em'
}
const TAG_STYLE = {
  backgroundColor: '#2598d9',
  borderRadius: '0.5em',
  color: 'white',
  fontSize: '0.6em',
  margin: '0.2em',
  marginTop: '-0.1em',
  padding: '0.3em',
  verticalAlign: 'middle'
}
const LINK_STYLE = {
  color: 'white',
  textDecoration: 'none'
}
const ADD_TAG_STYLE = {
  cursor: 'pointer',
  fontSize: '0.8em',
  marginLeft: '0.2em'
}
const REMOVE_TAG_STYLE = {
  cursor: 'pointer'
}

@propTypes({
  labels: propTypes.arrayOf(React.PropTypes.string).isRequired,
  onChange: propTypes.func,
  onDelete: propTypes.func,
  onAdd: propTypes.func,
  type: propTypes.string
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

  render () {
    const {
      labels,
      onAdd,
      onChange,
      onDelete,
      type
    } = this.props

    const deleteTag = (onDelete || onChange) && this._deleteTag

    return (
      <span className='form-group' style={{ color: '#999' }}>
        <Icon icon='tags' />
        {' '}
        <span>
          {map(labels.sort(), (label, index) =>
            <Tag type={type} label={label} onDelete={deleteTag} key={index} />
          )}
        </span>
        {(onAdd || onChange) && !this.state.editing
          ? <span onClick={this._startEdit} style={ADD_TAG_STYLE}>
            <Icon icon='add-tag' />
          </span>
          : <span>
            <input
              type='text'
              autoFocus
              style={INPUT_STYLE}
              onKeyDown={this._onKeyDown}
              onBlur={this._stopEdit}
            />
          </span>
        }
      </span>
    )
  }
}

export const Tag = ({ type, label, onDelete }) => {
  const filter = createProperty('tags', createString(label))

  return <span style={TAG_STYLE}>
    {type
      ? <Link to={`/home?t=${type}&s=${encodeURIComponent(filter::toString())}`} style={LINK_STYLE}>
        {label}
      </Link>
      : label
    }{' '}
    {onDelete
      ? <span onClick={onDelete && (() => onDelete(label))} style={REMOVE_TAG_STYLE}>
        <Icon icon='remove-tag' />
      </span>
      : []
    }
  </span>
}
Tag.propTypes = {
  label: React.PropTypes.string.isRequired
}
