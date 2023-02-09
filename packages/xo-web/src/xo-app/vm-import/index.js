import * as FormGrid from 'form-grid'
import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Container } from 'grid'
import { Select } from 'form'

import EsxiImport from './esxi-import'
import XvaImport from './xva-import'
import UrlImport from './url-import'

// ===================================================================

const DEFAULT_OPTION = {
  label: 'XVA',
  value: 'xva',
}

const IMPORT_TYPES = [
  DEFAULT_OPTION,
  {
    label: 'URL',
    value: 'url',
  },
  {
    label: 'ESXI',
    value: 'esxi',
  },
]

const RENDER_BY_TYPE = {
  xva: <XvaImport />,
  url: <UrlImport />,
  esxi: <EsxiImport />,
}

export default class Import extends Component {
  constructor(props) {
    super(props)
    this.state = {
      importType: DEFAULT_OPTION,
    }
  }

  render() {
    const { importType } = this.state

    return (
      <Container>
        <form id='import-form'>
          <FormGrid.Row>
            <FormGrid.LabelCol>{_('importFrom')}</FormGrid.LabelCol>
            <FormGrid.InputCol>
              <Select onChange={this.linkState('importType')} options={IMPORT_TYPES} required value={importType} />
            </FormGrid.InputCol>
          </FormGrid.Row>
          {RENDER_BY_TYPE[importType.value]}
        </form>
      </Container>
    )
  }
}
