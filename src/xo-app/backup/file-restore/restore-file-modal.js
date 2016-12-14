import _ from 'intl'
import Component from 'base-component'
import endsWith from 'lodash/endsWith'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import TreeSelect from 'rc-tree-select'
import { formatSize, noop } from 'utils'
import { FormattedDate } from 'react-intl'
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

// -----------------------------------------------------------------------------

export default class RestoreFileModalBody extends Component {
  get value () {
    const { state } = this

    return {
      disk: state.disk,
      partition: state.partition,
      paths: state.file && [ state.file ],
      remote: state.backup.remoteId
    }
  }

  _onBackupChange = backup => {
    this.setState({
      backup,
      disk: undefined,
      partition: undefined,
      file: undefined
    })
  }

  _onDiskChange = disk => {
    this.setState({
      disk,
      partition: undefined,
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

  _onPartitionChange = partition => {
    this.setState({
      partition,
      file: undefined
    })

    if (!partition) {
      return
    }

    const { backup, disk } = this.state
    scanFiles(backup.remoteId, disk, partition, '/').then(
      folderContent => {
        this.setState({
          tree: formatFolderContent(folderContent)
        })
      },
      noop
    )
  }

  // ---------------------------------------------------------------------------

  render () {
    const { backups } = this.props
    const {
      backup,
      disk,
      partitions,
      partition,
      tree,
      file
    } = this.state

    return <div>
      <SelectPlainObject
        onChange={this._onBackupChange}
        optionKey='id'
        optionRenderer={backupOptionRenderer}
        options={backups}
        placeholder={_('restoreFilesSelectBackup')}
        value={backup}
      />
      {backup && [
        <br />,
        <SelectPlainObject
          onChange={this._onDiskChange}
          optionKey='id'
          optionRenderer={diskOptionRenderer}
          options={backup.disks}
          placeholder={_('restoreFilesSelectDisk')}
          value={disk}
        />
      ]}
      {disk && partitions && [
        <br />,
        <SelectPlainObject
          onChange={this._onPartitionChange}
          optionKey='id'
          optionRenderer={partitionOptionRenderer}
          options={partitions}
          placeholder={_('restoreFilesSelectPartition')}
          value={partition}
        />
      ]}
      {partition && tree && [
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
