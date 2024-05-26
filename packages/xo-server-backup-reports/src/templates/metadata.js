import Handlebars from 'handlebars'

const UNKNOWN_ITEM = 'Unknown'

const taskTitle = `{{#ifCond task.data.type '===' 'xo'}}
[XO] {{jobName}}
{{~/ifCond}}
{{#ifCond task.data.type '===' 'remote'}}
[remote] {{task.additionnalData.name}}
{{~/ifCond}}
{{#ifCond task.data.type '===' 'pool'}}
[pool] {{#if task.data.pool.name_label ~}} {{task.data.pool.name_label}} {{~else if task.data?.poolMaster?.name_label ~}} {{task.data.poolMaster.name_label}} {{~else~}} ${UNKNOWN_ITEM} {{~/if}}
{{~/ifCond}}`

Handlebars.registerPartial('taskTitle', taskTitle)

const taskBody = `{{#ifCond task.data.type '===' 'remote'}}
- **ID**: {{task.data.id}}
{{/ifCond}}
{{#ifCond task.data.type '===' 'pool'}}
{{#if task.data.pool.uuid}}
- **UUID**: {{task.data.pool.uuid}}
{{else}}
- **ID**: {{task.data.id}}
{{/if}}
{{/ifCond}}`

Handlebars.registerPartial('taskBody', taskBody)

const metadataSubTaskPartial = `{{#*inline "indentedBlock"}}
{{>taskBody task=.}}
{{>reportTemporalData}}
{{~>reportError task=.}}
{{~>reportWarnings}}
{{/inline}}
- **{{>taskTitle task=. jobName=''}}** {{getIcon status}}
  {{> indentedBlock}}`

Handlebars.registerPartial('metadataSubtask', metadataSubTaskPartial)

export const metadataTemplate = `##  Global status: {{log.status}}

- **Job ID**: {{log.jobId}}
- **Job name**: {{jobName}}
- **Run ID**: {{log.id}}
{{>reportTemporalData end=log.end start=log.start}}
{{#if log.tasks.length}}
- **Successes**: {{#if tasksByStatus.success.length ~}} {{tasksByStatus.success.length}} {{~else~}} 0 {{~/if}} / {{log.tasks.length}}
{{/if}}
{{~>reportError task=log}}
{{~>reportWarnings warnings=log.warnings}}
{{#each tasksByStatus}}
---

{{titleByStatus @key}}
{{#each this}}


### {{>taskTitle task=. jobName=../../log.jobName}}
{{>taskBody task=.}}
{{>reportTemporalData formatDate=../../formatDate}}
{{~>reportError task=.}}
{{~>reportWarnings warnings=this.warnings}}
{{#each this.tasks}}
  {{>metadataSubtask formatDate=../../../formatDate}}
{{/each}}
{{/each}}
{{/each}}
---

*{{pkg.name}} v{{pkg.version}}*`
