import keys from 'lodash/keys'
import React from 'react'

import * as FormGrid from '../../form-grid'
import _ from '../../intl'
import Combobox from '../../combobox'
import Component from '../../base-component'
import propTypes from '../../prop-types-decorator'
import { createSelector } from '../../selectors'

@propTypes({
  type: propTypes.string.isRequired,
  user: propTypes.object.isRequired,
  value: propTypes.string.isRequired,
})
export default class SaveNewUserFilterModalBody extends Component {
  get value () {
    return this.state.name || ''
  }

  _getFilterOptions = createSelector(
    tmp =>
      (tmp = this.props.user) &&
      (tmp = tmp.preferences) &&
      (tmp = tmp.filters) &&
      tmp[this.props.type],
    keys
  )

  render () {
    const { value } = this.props
    const options = this._getFilterOptions()

    return (
      <div>
        <FormGrid.Row>
          <FormGrid.LabelCol>{_('filterName')}</FormGrid.LabelCol>
          <FormGrid.InputCol>
            <Combobox
              onChange={this.linkState('name')}
              options={options}
              value={this.state.name || ''}
            />
          </FormGrid.InputCol>
        </FormGrid.Row>
        <FormGrid.Row>
          <FormGrid.LabelCol>{_('filterValue')}</FormGrid.LabelCol>
          <FormGrid.InputCol>
            <input
              className='form-control'
              disabled
              type='text'
              value={value}
            />
          </FormGrid.InputCol>
        </FormGrid.Row>
      </div>
    )
  }
}
