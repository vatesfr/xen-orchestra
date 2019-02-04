import _ from 'intl'
import React from 'react'
import BaseComponent from 'base-component'
import { Row, Col } from 'grid'
import { forEach } from 'lodash'
import { createGetObjectsOfType } from 'selectors'
import { buildTemplate, connectStore } from 'utils'

@connectStore(
  {
    vms: createGetObjectsOfType('VM').pick((_, props) => props.vms),
  },
  { withRef: true }
)
export default class SnapshotVmModalBody extends BaseComponent {
  state = {
    descriptionPattern: '{description}',
    namePattern: '{name}_{date}',
  }

  get value() {
    const { descriptionPattern, namePattern, saveMemory } = this.state
    if (namePattern === '' && descriptionPattern === '') {
      return { names: {}, descriptions: {}, saveMemory }
    }

    const generateName = buildTemplate(namePattern, {
      '{name}': vm => vm.name_label,
      '{date}': new Date().toISOString(),
    })

    const generateDescription = buildTemplate(descriptionPattern, {
      '{description}': vm => vm.name_description,
    })

    const names = []
    const descriptions = []
    forEach(this.props.vms, ({ id, ...vm }) => {
      names[id] = generateName(vm)
      descriptions[id] = generateDescription(vm)
    })

    return {
      names,
      descriptions,
      saveMemory,
    }
  }

  render() {
    return (
      <div>
        <Row className='mb-1'>
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
          <Col size={6}>{_('snapshotVmsDescription')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('descriptionPattern')}
              type='text'
              value={this.state.descriptionPattern}
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
