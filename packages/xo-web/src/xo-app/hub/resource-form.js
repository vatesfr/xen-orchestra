import * as FormGrid from 'form-grid'
import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container } from 'grid'
import { SelectPool } from 'select-objects'
import { isSrWritable } from 'xo'
import { injectState, provideState } from 'reaclette'

export default decorate([
  provideState({
    initialState: ({ installPoolPredicate }) => ({
      selectedInstallPools: [],
      installPoolPredicate,
    }),
    effects: {
      initialize() {
        // return {
        //   // hide pools with already installed template
        //   poolPredicate: pool => pool.uuid !== this.props.uuid,
        // }
      },
      updateSelectedInstallPools(_, selectedInstallPools) {
        this.props.onChange({
          selectedInstallPools,
        })
        return {
          selectedInstallPools,
        }
      },
    },
  }),
  injectState,
  ({ effects, state }) => (
    <Container>
      <FormGrid.Row>
        <label>
          {_('vmImportToPool')}
          &nbsp;
          <Tooltip content={_('hubHideInstalledPoolMsg')}>
            <Icon icon='info' />
          </Tooltip>
        </label>
        <SelectPool
          className='mb-1'
          disabled={state.isTemplateInstalledOnAllPools}
          multi
          onChange={effects.updateSelectedInstallPools}
          predicate={state.installPoolPredicate}
          required
          value={state.selectedInstallPools}
        />
      </FormGrid.Row>
    </Container>
  ),
])
