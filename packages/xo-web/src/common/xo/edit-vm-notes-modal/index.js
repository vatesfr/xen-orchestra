import _ from 'intl'
import Icon from 'icon'
import clamp from 'lodash/clamp'
import Component from 'base-component'
import React from 'react'

export default class EditVmNotesModalBody extends Component {
  get value() {
    return { notes: this.state.notes ?? this.props.vm.notes ?? '' }
  }

  render() {
    return (
      <div>
        <textarea
          autoFocus
          rows={clamp(this.value.notes.split('\n').length, 5, 20)}
          onChange={this.linkState('notes')}
          value={this.value.notes}
          className='form-control'
        />
        {this.value.notes.length > 2048 && (
          <em className='text-warning'>
            <Icon icon='alarm' /> {_('vmNotesTooLong')}
          </em>
        )}
        <em>
          <Icon icon='info' />{' '}
          <a href='https://commonmark.org/help/' target='_blank' rel='noreferrer'>
            {_('supportsMarkdown')}
          </a>
        </em>
      </div>
    )
  }
}
