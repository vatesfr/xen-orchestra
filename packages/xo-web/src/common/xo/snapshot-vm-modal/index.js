import _ from 'intl'
import React from 'react'
import BaseComponent from 'base-component'
import { Row, Col } from 'grid'
import { mapValues } from 'lodash'
import { createGetObjectsOfType } from 'selectors'
import { buildTemplate, connectStore } from 'utils'

@connectStore(
  {
    vms: createGetObjectsOfType('VM').pick((_, props) => props.vms),
  },
  { withRef: true }
)
export default class SnapshotVmModalBody extends BaseComponent {
  state = { namePattern: '{name}_{date}' }

  get value() {
    const { namePattern, saveMemory } = this.state
    if (namePattern === '') {
      return { names: {}, saveMemory }
    }

    const generateName = buildTemplate(namePattern, {
      '{name}': vm => vm.name_label,
      '{date}': new Date().toISOString(),
    })

    return {
      names: mapValues(this.props.vms, generateName),
      saveMemory,
    }
  }

  render() {
    return (
      <div>
        <Row>
          <Col size={6}>{_('snapshotVmsName')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('namePattern')}
              type='text'
              value={this.state.namePattern}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <label>
              <input
                type='checkbox'
                onChange={this.linkState('saveMemory')}
                checked={this.state.saveMemory}
              />{' '}
              {_('snapshotSaveMemory')}
            </label>
          </Col>
        </Row>
      </div>
    )
  }
}
