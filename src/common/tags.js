import React, { Component } from 'react'
import Icon from 'icon'
import map from 'lodash/map'
import { propTypes } from 'utils'

@propTypes({
  labels: propTypes.arrayOf(React.PropTypes.string).isRequired,
  onDelete: propTypes.func,
  onAdd: propTypes.func
})
export default class Tags extends Component {
  componentWillMount () {
    this.setState({editing: false})
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
        &nbsp;
        <span>
          {map(labels.sort(), (label, index) => <Tag label={label} onDelete={onDelete ? () => onDelete(label) : undefined} key={index} />)}
        </span>
        {onAdd
          ? !this.state.editing
            ? <span className='add-tag-action' onClick={() => this.setState({editing: true})} style={{cursor: 'pointer'}}>
              <Icon icon='add-tag' />
            </span>
            : <span>
              <input
                type='text'
                autoFocus
                style={{maxWidth: '4em', margin: '2px'}}
                ref='newTag'
                onKeyDown={event => {
                  if (event.keyCode === 13 && this.refs.newTag.value) {
                    onAdd(this.refs.newTag.value)
                    this.refs.newTag.value = ''
                  } else if (event.keyCode === 27) {
                    this.setState({editing: false})
                  }
                }}
                onBlur={() => this.setState({editing: false})}
              ></input>
            </span>
          : []
        }
      </span>
    )
  }
}

export const Tag = ({ label, onDelete }) => (
  <span className='tag'>
    {label}&nbsp;
    {onDelete
      ? <span onClick={onDelete} style={{cursor: 'pointer'}}>
        <Icon icon='remove-tag' />
      </span>
      : []
    }
  </span>
)
Tag.propTypes = {
  label: React.PropTypes.string.isRequired
}
