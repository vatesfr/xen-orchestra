import _ from 'intl'
import React from 'react'
import BaseComponent from 'base-component'
import { compileTemplate } from '@xen-orchestra/template'
import { connectStore } from 'utils'
import { Container, Col, Row } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import forEach from 'lodash/forEach.js'

const RULES = {
  '{date}': () => new Date().toISOString(),
  '{description}': vm => vm.name_description,
  '{name}': vm => vm.name_label,
}

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

    const generateName = compileTemplate(namePattern, RULES)
    const generateDescription = compileTemplate(descriptionPattern, RULES)
    const names = {}
    const descriptions = {}

    forEach(this.props.vms, (vm, id) => {
      if (namePattern !== '') {
        names[id] = generateName(vm)
      }
      if (descriptionPattern !== '') {
        descriptions[id] = generateDescription(vm)
      }
    })

    return {
      descriptions,
      names,
      saveMemory,
    }
  }

  render() {
    return (
      <Container>
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
              <input type='checkbox' onChange={this.linkState('saveMemory')} checked={this.state.saveMemory} />{' '}
              {_('snapshotSaveMemory')}
            </label>
          </Col>
        </Row>
      </Container>
    )
  }
}
