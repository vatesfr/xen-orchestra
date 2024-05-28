import Handlebars from 'handlebars'

const vmSubTaskPartial = `{{#if subTaskLog}}
- **{{title}}** ({{id}}) {{getIcon subTaskLog.status}}
  {{>reportTemporalData end=subTaskLog.end start=subTaskLog.start}}
  {{~>reportWarnings warnings=subTaskLog.warnings}}
  {{~>reportError task=subTaskLog}}
{{else}}
  - **{{operationLog.message}}** {{getIcon operationLog.status}}
    {{>reportTemporalData end=operationLog.end start=operationLog.start}}
    {{#if operationLog.result.size}}
    - **Size**: {{formatSize operationLog.result.size}}
    - **Speed**: {{formatSpeed operationLog.result.size operationLog.start operationLog.end}}
    {{/if}}
    {{~>reportWarnings warnings=operationLog.warnings}}
    {{~>reportError task=operationLog}}
{{/if}}
`

const vmSubTextPartial = `{{#each snapshotSubtasks}}
- **Snapshot** {{getIcon subTaskLog.status}}
  {{>reportTemporalData end=subTaskLog.end start=subTaskLog.start formatDate=../formatDate}}
{{/each}}
{{#if srsSubTasks}}
- **SRs**
{{#each srsSubTasks}}
  {{>vmSubTaskPartial formatDate=../formatDate}}
{{/each}}
{{/if}}
{{#if remotesSubTasks}}
- **Remotes**
{{#each remotesSubTasks}}
  {{>vmSubTaskPartial formatDate=../formatDate}}
{{/each}}
{{/if}}
`

const vmTextPartial = `
{{#if vm}}
### {{vm.name_label}}

- **UUID**: {{vm.uuid}}
{{else}}
### VM not found

- **UUID**: {{taskLog.data.id}}
{{/if}}
{{>reportTemporalData end=taskLog.end start=taskLog.start}}
{{~>reportWarnings warnings=taskLog.warnings}}
`

const vmSuccessPartial = `---

## {{tasksByStatus.success.count}} {{#ifCond tasksByStatus.success.count '>' 1~}} Successes {{~^~}} Success {{~/ifCond}}

{{#each tasksByStatus.success.tasks}}
{{>vmTextPartial formatDate=../formatDate}}
{{>vmSubTextPartial formatDate=../formatDate}}
{{/each}}
`

const vmInterruptedPartial = `---

## {{tasksByStatus.interrupted.count}} Interrupted

{{#each tasksByStatus.interrupted.tasks}}
{{>vmTextPartial formatDate=../formatDate}}
{{>vmSubTextPartial formatDate=../formatDate}}
{{/each}}
`

const vmSkippedPartial = `---

## {{tasksByStatus.skipped.count}} Skipped

{{#each tasksByStatus.skipped.tasks}}
{{>vmTextPartial formatDate=../formatDate}}
- **Reason**: {{message}}
{{/each}}
`

const vmFailurePartial = `---

## {{tasksByStatus.failure.count}} {{#ifCond tasksByStatus.failure.count '>' 1~}} Failures {{~^~}} Failure {{~/ifCond}}

{{#each tasksByStatus.failure.tasks}}
{{#if uuid}}

### {{name}}

- **UUID**: {{uuid}}
- **Type**: {{taskLog.data.type}}
{{>reportTemporalData end=taskLog.end start=taskLog.start}}
{{~>reportWarnings warnings=taskLog.warnings}}
- **Error**: {{taskLog.result.message}}
{{else}}
{{>vmTextPartial formatDate=../formatDate}}
{{#if taskLog.result}}
- **Error**: {{taskLog.result.message}}
{{else}}
{{>vmSubTextPartial formatDate=../formatDate}}
{{/if}}
{{/if}}
{{/each}}
`

Handlebars.registerPartial('vmSubTaskPartial', vmSubTaskPartial)
Handlebars.registerPartial('vmSubTextPartial', vmSubTextPartial)
Handlebars.registerPartial('vmTextPartial', vmTextPartial)
Handlebars.registerPartial('vmSuccessPartial', vmSuccessPartial)
Handlebars.registerPartial('vmInterruptedPartial', vmInterruptedPartial)
Handlebars.registerPartial('vmSkippedPartial', vmSkippedPartial)
Handlebars.registerPartial('vmFailurePartial', vmFailurePartial)

export const vmSubject = `[Xen Orchestra] {{log.status}} − Backup report for {{jobName}} {{getIcon log.status}}`

export const vmTemplate = `## Global status: {{log.status}}

- **Job ID**: {{log.jobId}}
- **Run ID**: {{log.id}}
- **Mode**: {{log.data.mode}}
{{>reportTemporalData end=log.end start=log.start}}
{{#if log.tasks}}
- **Successes**: {{tasksByStatus.success.count}} / {{tasksByStatus.vmTasks.count}}
{{#if globalTransferSize}}
- **Transfer size**: {{formatSize globalTransferSize}}
{{/if}}
{{#if globalMergeSize}}
- **Merge size**: {{formatSize globalMergeSize}}
{{/if}}
{{~>reportWarnings warnings=log.warnings}}

{{#if tasksByStatus.failure.tasks}}
{{>vmFailurePartial}}
{{/if}}
{{#if tasksByStatus.skipped.tasks}}
{{>vmSkippedPartial}}
{{/if}}
{{#if tasksByStatus.interrupted.tasks}}
{{>vmInterruptedPartial}}
{{/if}}
{{#if tasksByStatus.success.tasks}}
{{>vmSuccessPartial}}
{{/if}}
{{else}}
{{~>reportError task=log}}
{{~>reportWarnings warnings=log.warnings}}
{{/if}}
---

*{{pkg.name}} v{{pkg.version}}*`
