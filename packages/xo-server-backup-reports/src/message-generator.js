import { capitalize, groupBy } from 'lodash'
import { get } from '@xen-orchestra/defined'

import {
  formatSize,
  formatSpeed,
  INDENT,
  STATUS_ICON,
  UNHEALTHY_VDI_CHAIN_ERROR,
  UNHEALTHY_VDI_CHAIN_MESSAGE,
} from './utils'

const handleOperationTask = (
  task,
  markdown,
  getTemporalDataMarkdown,
  vmSize
) => {
  const type = task.message
  if (type !== 'transfer' && type !== 'merge') {
    return
  }
  const { result, status } = task
  markdown.push(
    `${INDENT.repeat(2)}- **${capitalize(type)}** ${STATUS_ICON[status]}`,
    ...getTemporalDataMarkdown(task.start, task.end, 3)
  )

  if (status === 'success') {
    const size = task.result.size
    vmSize[type] === undefined && (vmSize[type] = size)
    markdown.push(
      `${INDENT.repeat(3)}- **Size**: ${formatSize(size)}`,
      `${INDENT.repeat(3)}- **Speed**: ${formatSpeed(
        size,
        task.end - task.start
      )}`
    )
    return
  }

  const errorMessage = get(() => result.message)
  errorMessage !== undefined &&
    markdown.push(`${INDENT.repeat(3)}- **Error**: ${errorMessage}`)
}

const handleTargetTask = (
  task,
  markdown,
  name,
  uuidOrId,
  getTemporalDataMarkdown,
  failedTargetsName,
  vmSize
) => {
  const { status } = task
  markdown.push(
    `${INDENT}- **${name}** (${uuidOrId}) ${STATUS_ICON[status]}`,
    ...getTemporalDataMarkdown(task.start, task.end, 2)
  )

  if (status === 'failure') {
    const errorMessage = get(() => task.result.message)
    errorMessage !== undefined &&
      markdown.push(`${INDENT.repeat(2)}- **Error**: ${errorMessage}`)
    failedTargetsName.push(`(${task.data.type}) ${name}`)
  }

  task.tasks !== undefined &&
    task.tasks.forEach(task =>
      handleOperationTask(task, markdown, getTemporalDataMarkdown, vmSize)
    )
}

const TARGET_TASKS_GENERATORS = {
  remote: async function (tasks, ...args) {
    const markdown = this._markdown
    markdown.push('- **Remotes**')
    for (const task of tasks) {
      const id = task.data.id
      const remote = await this._xo.getRemote(id).catch(() => {})
      const name = remote !== undefined ? remote.name : 'Remote Not found'
      handleTargetTask(
        task,
        markdown,
        name,
        id,
        this._getTemporalDataMarkdown,
        ...args
      )
    }
  },
  sr: function (tasks, ...args) {
    const markdown = this._markdown
    markdown.push('- **SRs**')
    for (const task of tasks) {
      const id = task.data.id
      let sr
      try {
        sr = this._xo.getObject(id)
      } catch (e) {}
      const [name, uuid] =
        sr !== undefined ? [sr.name_label, sr.uuid] : [`SR Not found`, id]
      handleTargetTask(
        task,
        markdown,
        name,
        uuid,
        this._getTemporalDataMarkdown,
        ...args
      )
    }
  },
}

const VM_SUB_TASKS_GENERATORS = {
  snapshot: function (tasks) {
    const markdown = this._markdown
    const snapshotTask = tasks[0]
    markdown.push(
      `- **Snapshot** ${STATUS_ICON[snapshotTask.status]}`,
      ...this._getTemporalDataMarkdown(snapshotTask.start, snapshotTask.end, 1)
    )
  },
  export: async function (tasks, ...args) {
    const tasksByType = groupBy(tasks, 'data.type')
    for (const type in tasksByType) {
      const generator = TARGET_TASKS_GENERATORS[type.toLowerCase()]
      generator !== undefined &&
        (await this::generator(tasksByType[type], ...args))
    }
  },
}

export default class {
  constructor (xo, log, getTemporalDataMarkdown) {
    this._xo = xo
    this._log = log
    this._getTemporalDataMarkdown = getTemporalDataMarkdown
    this._markdown = []
    this._nagiosText = []
    this._globalSize = {
      transfer: 0,
      merge: 0,
    }
  }

  async handleVmTask (vmTask) {
    const { _markdown: markdown, _nagiosText: nagiosText } = this
    const id = vmTask.data.id
    let vm
    try {
      vm = this._xo.getObject(id)
    } catch (e) {}
    const [name, uuid] =
      vm !== undefined ? [vm.name_label, vm.uuid] : ['VM not found', id]
    markdown.push(
      '',
      `### ${name}`,
      '',
      `- **UUID**: ${uuid}`,
      ...this._getTemporalDataMarkdown(vmTask.start, vmTask.end)
    )

    let errorMessage = get(() => vmTask.result.message)
    if (errorMessage !== undefined) {
      const errorLabel = vmTask.status === 'skipped' ? 'Reason' : 'Error'
      errorMessage === UNHEALTHY_VDI_CHAIN_ERROR &&
        (errorMessage = UNHEALTHY_VDI_CHAIN_MESSAGE)

      markdown.push(`- **${errorLabel}**: ${errorMessage}`)
      nagiosText.push(
        `[(${capitalize(vmTask.status)}) ${name}: ${errorMessage}]`
      )
    }

    const vmSize = {
      transfer: undefined,
      merge: undefined,
    }
    const failedTargetsName = []
    const vmSubTasksByType = groupBy(vmTask.tasks, 'message')
    for (const message in vmSubTasksByType) {
      const generator = VM_SUB_TASKS_GENERATORS[message]
      generator !== undefined &&
        (await this::generator(
          vmSubTasksByType[message],
          failedTargetsName,
          vmSize
        ))
    }

    vmTask.status === 'interrupted' &&
      nagiosText.push(`[(Interrupted) ${name}]`)
    failedTargetsName.length > 0 &&
      nagiosText.push(`[${name}: (failed)[${failedTargetsName.toString()}]]`)

    const globalSize = this._globalSize
    const { transfer, merge } = vmSize
    transfer > 0 && (globalSize.transfer += vmSize.transfer)
    merge > 0 && (globalSize.merge += vmSize.merge)
  }

  getGlobalTransferSize () {
    return this._globalSize.transfer
  }

  getGlobalMergeSize () {
    return this._globalSize.merge
  }

  generate () {
    return this._markdown
  }

  generateNagiosText () {
    return this._nagiosText
  }
}
