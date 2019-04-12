import * as FormGrid from 'form-grid'
import Component from 'base-component'
import { Container } from 'grid'
import Dropzone from 'dropzone'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import { mapPlus } from 'utils'
import { readCapacityAndGrainTable } from 'xo-vmdk-to-vhd'
import fromEvent from 'promise-toolbox/fromEvent'
import { importFromVmdk } from 'xo'

export default class VmdkImport extends Component {
  constructor(props) {
    super(props)
    this.state.sr = 'a5954951-3dfa-42b8-803f-4bc270b22a0b'
  }

  /* global FileReader */
  async _parseVmdk(file) {
    return readCapacityAndGrainTable(async (start, end) => {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file.slice(start, end))
      return (await fromEvent(reader, 'loadend')).target.result
    })
  }

  /* eslint-disable no-console */
  _handleDrop = async files => {
    console.log('dropped', files)
    await Promise.all(
      mapPlus(files, async (file, push) => {
        const { name } = file
        const extIndex = name.lastIndexOf('.')
        let type
        if (
          extIndex >= 0 &&
          (type = name.slice(extIndex + 1)) &&
          (type === 'vmdk' || type === 'vhd')
        ) {
          let vmdkData
          if (type === 'vmdk') {
            const parsed = await this._parseVmdk(file)
            console.log('parsed file', name, parsed.capacityBytes)
            vmdkData = {
              blocksTable: await parsed.tablePromise,
              capacity: parsed.capacityBytes,
            }
          }
          const res = await importFromVmdk(
            this.state.sr,
            type,
            name,
            vmdkData,
            file
          )
          console.log('imported ', res)
        }
      })
    )
  }

  _setSR = sr => {
    console.log('set SR', sr)
    this.setState({ sr })
  }

  render() {
    const pageHeader = (
      <Container>
        <h2>
          <Icon icon='menu-xosan' /> Import VMDK file
        </h2>
      </Container>
    )
    return (
      <Page header={pageHeader} title='vmdkimport'>
        <form id='import-form'>
          <FormGrid.Row>
            <FormGrid.LabelCol>SR ID: </FormGrid.LabelCol>
            <FormGrid.InputCol>
              <input
                type='text'
                ref='sr'
                onChange={this._setSR}
                defaultValue={this.state.sr}
              />
            </FormGrid.InputCol>
          </FormGrid.Row>

          <FormGrid.Row>
            <Dropzone
              onDrop={this._handleDrop}
              message='Drop your VHD or VMDK file here'
            />
          </FormGrid.Row>
        </form>
      </Page>
    )
  }
}
