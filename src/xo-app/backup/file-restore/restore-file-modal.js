import _, { messages } from 'intl'
import Component from 'base-component'
import DebounceInput from 'react-debounce-input'
import endsWith from 'lodash/endsWith'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import TreeSelect from 'rc-tree-select'
import { formatSize, noop } from 'utils'
import { FormattedDate, injectIntl } from 'react-intl'
import { SelectPlainObject } from 'form'
import {
  scanDisk,
  scanFiles
} from 'xo'

const SELECT_FILES_STYLE = { width: '100%' }
const SELECT_FILES_DROPDOWN_STYLE = { maxHeight: 200, overflow: 'auto', zIndex: 1500 }

const backupOptionRenderer = backup => <span>
  {backup.tag} - {backup.remoteName}
  {' '}
  (<FormattedDate value={new Date(backup.datetime)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />)
</span>

const partitionOptionRenderer = partition => <span>
  {partition.name} {partition.type} ({formatSize(+partition.size)})
</span>

const diskOptionRenderer = disk => <span>
  {disk.name}
</span>

const formatFolderContent = (folderContent, path = '/') =>
  map(folderContent, (subTree, folder) => {
    const isFile = !endsWith(folder, '/')
    const subPath = path + folder

    return {
      children: isFile ? [] : formatFolderContent(subTree, subPath),
      disabled: !isFile && isEmpty(subTree),
      selectable: isFile,
      key: subPath,
      label: folder,
      value: subPath
    }
  })

class RestoreFileModalBody extends Component {
  get value () {
    const { state } = this

    return {
      disk: state.disk,
      partition: state.partition,
      paths: state.file && [ state.file ],
      remote: state.backup.remoteId
    }
  }

  _onBackupChange = backup => { // ---------------------------------------------
    this.setState({
      backup,
      disk: undefined,
      partition: undefined,
      folderPath: '',
      file: undefined
    })
  }

  _onDiskChange = disk => { // -------------------------------------------------
    this.setState({
      disk,
      partition: undefined,
      folderPath: '',
      file: undefined
    })

    if (!disk) {
      return
    }

    scanDisk(this.state.backup.remoteId, disk).then(
      ({ partitions }) => {
        this.setState({
          partitions
        })
      },
      noop
    )
  }

  _onPartitionChange = partition => { // ---------------------------------------
    this.setState({
      partition,
      folderPath: '',
      file: undefined
    })
  }

  _onFolderPathChange = event => { // ------------------------------------------
    const folderPath = event.target.value

    this.setState({
      folderPath,
      file: undefined
    })

    if (!folderPath) {
      return
    }

    const { backup, disk, partition } = this.state
    scanFiles(backup.remoteId, disk, partition, folderPath).then(
      folderContent => {
        this.setState({
          tree: formatFolderContent(folderContent, `${folderPath}/`)
        })
      },
      noop
    )
  }

  // ---------------------------------------------------------------------------

  render () {
    const { backups, intl } = this.props
    const {
      backup,
      disk,
      partitions,
      partition,
      folderPath,
      tree,
      file
    } = this.state

    return <div>
      <SelectPlainObject
        onChange={this._onBackupChange}
        optionKey='path'
        optionRenderer={backupOptionRenderer}
        options={backups}
        placeholder={_('restoreFilesSelectBackup')}
      />
      {backup && [
        <br />,
        <SelectPlainObject
          onChange={this._onDiskChange}
          optionKey='id'
          optionRenderer={diskOptionRenderer}
          options={backup.disks}
          placeholder={_('restoreFilesSelectDisk')}
        />
      ]}
      {backup && disk && partitions && [
        <br />,
        <SelectPlainObject
          onChange={this._onPartitionChange}
          optionKey='id'
          optionRenderer={partitionOptionRenderer}
          options={partitions}
          placeholder={_('restoreFilesSelectPartition')}
        />
      ]}
      {backup && disk && partition && [
        <br />,
        <DebounceInput
          className='form-control'
          debounceTimeout={300}
          onChange={this._onFolderPathChange}
          placeholder={intl.formatMessage(messages.restoreFilesSelectFolderPath)}
          value={folderPath}
        />
      ]}
      {backup && disk && partition && folderPath && tree && [
        <br />,
        <TreeSelect
          dropdownStyle={SELECT_FILES_DROPDOWN_STYLE}
          notFoundContent={<em>{_('restoreFileInvalidFolder')}</em>}
          onChange={this.linkState('file')}
          placeholder={_('restoreFilesSelectFiles')}
          showSearch={false}
          style={SELECT_FILES_STYLE}
          treeData={tree}
          treeLine
          value={file}
        />
      ]}
    </div>
  }
}

export default injectIntl(RestoreFileModalBody, {withRef: true})
