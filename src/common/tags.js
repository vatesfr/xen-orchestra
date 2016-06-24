import React from 'react'
import Icon from 'icon'
import map from 'lodash/map'

import Component from './base-component'
import { propTypes } from './utils'

@propTypes({
  labels: propTypes.arrayOf(React.PropTypes.string).isRequired,
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

  render () {
    const {
      labels,
      onDelete,
      onAdd
    } = this.props
    return (
      <span className='form-group' style={{ color: '#999' }}>
        <Icon icon='tags' />
        {' '}
        <span>
          {map(labels.sort(), (label, index) =>
            <Tag label={label} onDelete={onDelete} key={index} />
          )}
        </span>
        {onAdd
          ? !this.state.editing
            ? <span className='add-tag-action' onClick={this._startEdit} style={{cursor: 'pointer'}}>
              <Icon icon='add-tag' />
            </span>
            : <span>
              <input
                type='text'
                autoFocus
                style={{maxWidth: '4em', margin: '2px'}}
                onKeyDown={event => {
                  const { target } = event

                  if (event.keyCode === 13 && target.value) {
                    onAdd(target.value)
                    target.value = ''
                  } else if (event.keyCode === 27) {
                    this._stopEdit()
                  }
                }}
                onBlur={this._stopEdit}
              ></input>
            </span>
          : []
        }
      </span>
    )
  }
}

export const Tag = ({ label, onDelete }) => (
  <span className='xo-tag'>
    {label}{' '}
    {onDelete
      ? <span onClick={onDelete && (() => onDelete(label))} style={{cursor: 'pointer'}}>
        <Icon icon='remove-tag' />
      </span>
      : []
    }
  </span>
)
Tag.propTypes = {
  label: React.PropTypes.string.isRequired
}
