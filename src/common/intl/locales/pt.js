// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/pt'

import reactIntlData from 'react-intl/locale-data/pt'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: '{key}: {value}'
  keyValue: undefined,

  // Original text: 'Connecting'
  statusConnecting: undefined,

  // Original text: 'Disconnected'
  statusDisconnected: undefined,

  // Original text: 'Loading…'
  statusLoading: undefined,

  // Original text: 'Page not found'
  errorPageNotFound: undefined,

  // Original text: 'no such item'
  errorNoSuchItem: undefined,

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Longo clique para editar',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Clique para editar',

  // Original text: 'Browse files'
  browseFiles: undefined,

  // Original text: 'Show logs'
  showLogs: undefined,

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'Confirmar',

  // Original text: 'Cancel'
  genericCancel: undefined,

  // Original text: 'Enter the following text to confirm:'
  enterConfirmText: undefined,

  // Original text: 'On error'
  onError: undefined,

  // Original text: 'Successful'
  successful: undefined,

  // Original text: 'Managed disks'
  filterOnlyManaged: undefined,

  // Original text: 'Orphaned disks'
  filterOnlyOrphaned: undefined,

  // Original text: 'Normal disks'
  filterOnlyRegular: undefined,

  // Original text: 'Snapshot disks'
  filterOnlySnapshots: undefined,

  // Original text: 'Unmanaged disks'
  filterOnlyUnmanaged: undefined,

  // Original text: 'Save…'
  filterSaveAs: undefined,

  // Original text: 'Explore the search syntax in the documentation'
  filterSyntaxLinkTooltip: undefined,

  // Original text: 'Connected VIFs'
  filterVifsOnlyConnected: undefined,

  // Original text: 'Disconnected VIFs'
  filterVifsOnlyDisconnected: undefined,

  // Original text: 'Copy to clipboard'
  copyToClipboard: undefined,

  // Original text: 'Master'
  pillMaster: undefined,

  // Original text: "Home"
  homePage: 'Principal',

  // Original text: 'VMs'
  homeVmPage: undefined,

  // Original text: 'Hosts'
  homeHostPage: undefined,

  // Original text: 'Pools'
  homePoolPage: undefined,

  // Original text: 'Templates'
  homeTemplatePage: undefined,

  // Original text: 'Storages'
  homeSrPage: undefined,

  // Original text: "Dashboard"
  dashboardPage: 'Painel de Controle',

  // Original text: "Overview"
  overviewDashboardPage: 'Visão Geral',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Visualizações',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'Estatisticas',

  // Original text: "Health"
  overviewHealthDashboardPage: 'Diagnóstico',

  // Original text: "Self service"
  selfServicePage: 'Auto-Serviço',

  // Original text: "Backup"
  backupPage: 'Backup',

  // Original text: "Jobs"
  jobsPage: 'Tarefas',

  // Original text: 'XOA'
  xoaPage: undefined,

  // Original text: "Updates"
  updatePage: 'Atualizações',

  // Original text: 'Licenses'
  licensesPage: undefined,

  // Original text: "Settings"
  settingsPage: 'Configurações',

  // Original text: "Servers"
  settingsServersPage: 'Servidores',

  // Original text: "Users"
  settingsUsersPage: 'Usuários',

  // Original text: "Groups"
  settingsGroupsPage: 'Grupos',

  // Original text: "ACLs"
  settingsAclsPage: 'Controle de Acessos',

  // Original text: "Plugins"
  settingsPluginsPage: 'Plugins',

  // Original text: 'Logs'
  settingsLogsPage: undefined,

  // Original text: 'IPs'
  settingsIpsPage: undefined,

  // Original text: 'Config'
  settingsConfigPage: undefined,

  // Original text: "About"
  aboutPage: 'Sobre',

  // Original text: 'About XO {xoaPlan}'
  aboutXoaPlan: undefined,

  // Original text: "New"
  newMenu: 'Novo(a)',

  // Original text: "Tasks"
  taskMenu: 'Tarefas',

  // Original text: 'Tasks'
  taskPage: undefined,

  // Original text: "VM"
  newVmPage: 'VM',

  // Original text: "Storage"
  newSrPage: 'Armazenamento (Storage)',

  // Original text: "Server"
  newServerPage: 'Servidor',

  // Original text: "Import"
  newImport: 'Importar',

  // Original text: 'XOSAN'
  xosan: undefined,

  // Original text: "Overview"
  backupOverviewPage: 'Visão Geral',

  // Original text: "New"
  backupNewPage: 'Novo(a)',

  // Original text: "Remotes"
  backupRemotesPage: 'Armazenamento a distância',

  // Original text: "Restore"
  backupRestorePage: 'Recuperar',

  // Original text: 'File restore'
  backupFileRestorePage: undefined,

  // Original text: "Schedule"
  schedule: 'Agendamento',

  // Original text: "New VM backup"
  newVmBackup: 'Criar novo backup VM',

  // Original text: "Edit VM backup"
  editVmBackup: 'Editar backup VM',

  // Original text: "Backup"
  backup: 'Backup',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Snapshots ativos',

  // Original text: "Delta Backup"
  deltaBackup: 'Backup Diferencial',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'Recuperação de Desastres',

  // Original text: "Continuous Replication"
  continuousReplication: 'Replicação Contínua',

  // Original text: "Overview"
  jobsOverviewPage: 'Visão Geral',

  // Original text: "New"
  jobsNewPage: 'Novo(a)',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Agendamentos',

  // Original text: "Custom Job"
  customJob: 'Personalização do Trabalho',

  // Original text: 'User'
  userPage: undefined,

  // Original text: 'XOA'
  xoa: undefined,

  // Original text: 'No support'
  noSupport: undefined,

  // Original text: 'Free upgrade!'
  freeUpgrade: undefined,

  // Original text: "Sign out"
  signOut: 'Sair',

  // Original text: 'Edit my settings {username}'
  editUserProfile: undefined,

  // Original text: "Fetching data…"
  homeFetchingData: 'Obtendo dados…',

  // Original text: "Welcome to Xen Orchestra!"
  homeWelcome: 'Bem-vindo ao Xen Orchestra',

  // Original text: "Add your XenServer hosts or pools"
  homeWelcomeText: 'Adicione seu XenServer hosts e pools',

  // Original text: 'Some XenServers have been registered but are not connected'
  homeConnectServerText: undefined,

  // Original text: "Want some help?"
  homeHelp: 'Posso te ajudar?',

  // Original text: "Add server"
  homeAddServer: 'Adicionar Servidor',

  // Original text: 'Connect servers'
  homeConnectServer: undefined,

  // Original text: "Online Doc"
  homeOnlineDoc: 'Documentação Online',

  // Original text: "Pro Support"
  homeProSupport: 'Suporte Especializado',

  // Original text: "There are no VMs!"
  homeNoVms: 'Não foram encontradas VMs!',

  // Original text: "Or…"
  homeNoVmsOr: 'Ou…',

  // Original text: "Import VM"
  homeImportVm: 'Importar VM',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'Importar uma VM existente no formato XVA',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Restaurar um backup',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Restaurar um backup remoto',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Pronto para criar uma nova VM?',

  // Original text: "Filters"
  homeFilters: 'Filtros',

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: undefined,

  // Original text: "Pool"
  homeTypePool: 'Pool',

  // Original text: "Host"
  homeTypeHost: 'Host',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: 'Template'
  homeTypeVmTemplate: undefined,

  // Original text: "Sort"
  homeSort: 'Classificar',

  // Original text: "Pools"
  homeAllPools: 'Pools',

  // Original text: "Hosts"
  homeAllHosts: 'Hosts',

  // Original text: "Tags"
  homeAllTags: 'Etiquetas',

  // Original text: 'Resource sets'
  homeAllResourceSets: undefined,

  // Original text: "New VM"
  homeNewVm: 'Criar nova VM',

  // Original text: 'None'
  homeFilterNone: undefined,

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Hosts Ativos',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Hosts Desativados',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'VMs Ativas',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: 'VMs Paradas',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'VMs pendentes',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'HVM guests',

  // Original text: "Tags"
  homeFilterTags: 'Etiquetas',

  // Original text: "Sort by"
  homeSortBy: 'Ordenar por',

  // Original text: 'CPUs'
  homeSortByCpus: undefined,

  // Original text: "Name"
  homeSortByName: 'Nome',

  // Original text: "Power state"
  homeSortByPowerstate: 'Estado de energia',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: 'Shared/Not shared'
  homeSortByShared: undefined,

  // Original text: 'Size'
  homeSortBySize: undefined,

  // Original text: 'Type'
  homeSortByType: undefined,

  // Original text: 'Usage'
  homeSortByUsage: undefined,

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: 'Snapshots'
  homeSortVmsBySnapshots: undefined,

  // Original text: '{displayed, number}x {icon} (on {total, number})'
  homeDisplayedItems: undefined,

  // Original text: '{selected, number}x {icon} selected (on {total, number})'
  homeSelectedItems: undefined,

  // Original text: "More"
  homeMore: 'Mais',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migrar para…',

  // Original text: 'Missing patches'
  homeMissingPaths: undefined,

  // Original text: 'Master:'
  homePoolMaster: undefined,

  // Original text: 'Resource set: {resourceSet}'
  homeResourceSet: undefined,

  // Original text: 'High Availability'
  highAvailability: undefined,

  // Original text: 'Shared {type}'
  srSharedType: undefined,

  // Original text: 'Not shared {type}'
  srNotSharedType: undefined,

  // Original text: 'All of them are selected'
  sortedTableAllItemsSelected: undefined,

  // Original text: 'No items found'
  sortedTableNoItems: undefined,

  // Original text: '{nFiltered, number} of {nTotal, number} items'
  sortedTableNumberOfFilteredItems: undefined,

  // Original text: '{nTotal, number} items'
  sortedTableNumberOfItems: undefined,

  // Original text: '{nSelected, number} selected'
  sortedTableNumberOfSelectedItems: undefined,

  // Original text: 'Click here to select all items'
  sortedTableSelectAllItems: undefined,

  // Original text: "Add"
  add: 'Adicionar',

  // Original text: 'Select all'
  selectAll: undefined,

  // Original text: "Remove"
  remove: 'Remover',

  // Original text: "Preview"
  preview: 'Pré-visualização',

  // Original text: "Item"
  item: 'Item',

  // Original text: "No selected value"
  noSelectedValue: 'Valor não selecionado',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Escolha um usuário(s) e/ou grupo(s)',

  // Original text: "Select Object(s)…"
  selectObjects: 'Selecionar Objeto(s)…',

  // Original text: "Choose a role"
  selectRole: 'Escolha uma função',

  // Original text: "Select Host(s)…"
  selectHosts: 'Selecionar Host(s)…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Selecionar Objeto(s)…',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Selecionar Rede(s)…',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Selecionar PIF(s)…',

  // Original text: "Select Pool(s)…"
  selectPools: 'Selecionar Pool(s)…',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Selecionar Remote(s)…',

  // Original text: 'Select resource set(s)…'
  selectResourceSets: undefined,

  // Original text: 'Select template(s)…'
  selectResourceSetsVmTemplate: undefined,

  // Original text: 'Select SR(s)…'
  selectResourceSetsSr: undefined,

  // Original text: 'Select network(s)…'
  selectResourceSetsNetwork: undefined,

  // Original text: 'Select disk(s)…'
  selectResourceSetsVdi: undefined,

  // Original text: 'Select SSH key(s)…'
  selectSshKey: undefined,

  // Original text: "Select SR(s)…"
  selectSrs: 'Selecionar SR(s)…',

  // Original text: "Select VM(s)…"
  selectVms: 'Selecionar VM(s)…',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Selecionar VM(s) modelo(s)…',

  // Original text: "Select tag(s)…"
  selectTags: 'Selecionar etiqueta(s)…',

  // Original text: "Select disk(s)…"
  selectVdis: 'Selecionar disco(s)…',

  // Original text: 'Select timezone…'
  selectTimezone: undefined,

  // Original text: 'Select IP(s)…'
  selectIp: undefined,

  // Original text: 'Select IP pool(s)…'
  selectIpPool: undefined,

  // Original text: 'Select VGPU type(s)…'
  selectVgpuType: undefined,

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Preencha as informações necessárias.',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Preencha as informações (opcional)',

  // Original text: "Reset"
  selectTableReset: 'Reiniciar',

  // Original text: "Month"
  schedulingMonth: 'Agendamento Mensal',

  // Original text: 'Every N month'
  schedulingEveryNMonth: undefined,

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Agendamento escolhido por mês',

  // Original text: 'Day'
  schedulingDay: undefined,

  // Original text: 'Every N day'
  schedulingEveryNDay: undefined,

  // Original text: 'Each selected day'
  schedulingEachSelectedDay: undefined,

  // Original text: 'Switch to week days'
  schedulingSetWeekDayMode: undefined,

  // Original text: 'Switch to month days'
  schedulingSetMonthDayMode: undefined,

  // Original text: "Hour"
  schedulingHour: 'Hora',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Cada hora selecionada',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Todas N horas',

  // Original text: "Minute"
  schedulingMinute: 'Minuto',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Cada minuto selecionado',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Todos N minutos',

  // Original text: 'Every month'
  selectTableAllMonth: undefined,

  // Original text: 'Every day'
  selectTableAllDay: undefined,

  // Original text: 'Every hour'
  selectTableAllHour: undefined,

  // Original text: 'Every minute'
  selectTableAllMinute: undefined,

  // Original text: "Reset"
  schedulingReset: 'Reiniciar',

  // Original text: "Unknown"
  unknownSchedule: 'Desconhecido',

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: undefined,

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: undefined,

  // Original text: 'Cron Pattern:'
  cronPattern: undefined,

  // Original text: 'Cannot edit backup'
  backupEditNotFoundTitle: undefined,

  // Original text: 'Missing required info for edition'
  backupEditNotFoundMessage: undefined,

  // Original text: 'Successful'
  successfulJobCall: undefined,

  // Original text: 'Failed'
  failedJobCall: undefined,

  // Original text: 'In progress'
  jobCallInProgess: undefined,

  // Original text: 'Transfer size:'
  jobTransferredDataSize: undefined,

  // Original text: 'Transfer speed:'
  jobTransferredDataSpeed: undefined,

  // Original text: 'Merge size:'
  jobMergedDataSize: undefined,

  // Original text: 'Merge speed:'
  jobMergedDataSpeed: undefined,

  // Original text: 'All'
  allJobCalls: undefined,

  // Original text: "Job"
  job: 'Tarefa',

  // Original text: 'Job {job}'
  jobModalTitle: undefined,

  // Original text: "ID"
  jobId: 'ID tarefa',

  // Original text: 'Type'
  jobType: undefined,

  // Original text: "Name"
  jobName: 'Nome',

  // Original text: 'Name of your job (forbidden: "_")'
  jobNamePlaceholder: undefined,

  // Original text: "Start"
  jobStart: 'Inicia',

  // Original text: "End"
  jobEnd: 'Termina',

  // Original text: "Duration"
  jobDuration: 'Duração',

  // Original text: "Status"
  jobStatus: 'Status',

  // Original text: "Action"
  jobAction: 'Ação',

  // Original text: "Tag"
  jobTag: 'Etiqueta',

  // Original text: "Scheduling"
  jobScheduling: 'Agendamento',

  // Original text: "State"
  jobState: 'Estado',

  // Original text: 'Enabled'
  jobStateEnabled: undefined,

  // Original text: 'Disabled'
  jobStateDisabled: undefined,

  // Original text: 'Timezone'
  jobTimezone: undefined,

  // Original text: 'Server'
  jobServerTimezone: undefined,

  // Original text: "Run job"
  runJob: 'Iniciar tarefa',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: 'O backup manual foi executado. Clique em Visão Geral para ver os Logs',

  // Original text: "Started"
  jobStarted: 'Iniciado',

  // Original text: "Finished"
  jobFinished: 'Terminado',

  // Original text: "Save"
  saveBackupJob: 'Salvar',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Remover tarefa de backup',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'Você tem certeza que você quer deletar esta tarefa de backup?',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Ativar imediatamente após criação',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'Você esta editando o Agendamento {name} ({id}). Este procedimento irá substituir o agendamento atual.',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'Você esta editando a Tarefa {name} ({id}). Este procedimento irá substituir a tarefa atual.',

  // Original text: 'Edit'
  scheduleEdit: undefined,

  // Original text: 'Delete'
  scheduleDelete: undefined,

  // Original text: 'Delete selected schedules'
  deleteSelectedSchedules: undefined,

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Sem agendamentos',

  // Original text: 'New schedule'
  newSchedule: undefined,

  // Original text: "No jobs found."
  noJobs: 'Tarefas não encontradas',

  // Original text: "No schedules found"
  noSchedules: 'Nenhum agendamento foi encontrado',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Selecione um comando para xo-server API',

  // Original text: 'Timeout (number of seconds after which a VM is considered failed)'
  jobTimeoutPlaceHolder: undefined,

  // Original text: 'Schedules'
  jobSchedules: undefined,

  // Original text: 'Name of your schedule'
  jobScheduleNamePlaceHolder: undefined,

  // Original text: 'Select a Job'
  jobScheduleJobPlaceHolder: undefined,

  // Original text: 'Job owner'
  jobOwnerPlaceholder: undefined,

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: undefined,

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: undefined,

  // Original text: 'Backup owner'
  backupOwner: undefined,

  // Original text: "Select your backup type:"
  newBackupSelection: 'Selecione seu tipo de backup',

  // Original text: 'Select backup mode:'
  smartBackupModeSelection: undefined,

  // Original text: 'Normal backup'
  normalBackup: undefined,

  // Original text: 'Smart backup'
  smartBackup: undefined,

  // Original text: 'Local remote selected'
  localRemoteWarningTitle: undefined,

  // Original text: 'Warning: local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage: undefined,

  // Original text: 'Warning: this feature works only with XenServer 6.5 or newer.'
  backupVersionWarning: undefined,

  // Original text: 'VMs'
  editBackupVmsTitle: undefined,

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: undefined,

  // Original text: 'Resident on'
  editBackupSmartResidentOn: undefined,

  // Original text: 'Pools'
  editBackupSmartPools: undefined,

  // Original text: 'Tags'
  editBackupSmartTags: undefined,

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: undefined,

  // Original text: 'Reverse'
  editBackupNot: undefined,

  // Original text: 'Tag'
  editBackupTagTitle: undefined,

  // Original text: 'Report'
  editBackupReportTitle: undefined,

  // Original text: 'Automatically run as scheduled'
  editBackupScheduleEnabled: undefined,

  // Original text: 'Retention'
  editBackupRetentionTitle: undefined,

  // Original text: 'Remote'
  editBackupRemoteTitle: undefined,

  // Original text: 'Delete the old backups first'
  deleteOldBackupsFirst: undefined,

  // Original text: "Remote stores for backup"
  remoteList: 'Backups remotos',

  // Original text: "New File System Remote"
  newRemote: 'Novo Arquivo de Sistema Remoto',

  // Original text: "Local"
  remoteTypeLocal: 'Local',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: 'Type',

  // Original text: 'SMB remotes are meant to work on Windows Server. For other systems (Linux Samba, which means almost all NAS), please use NFS.'
  remoteSmbWarningMessage: undefined,

  // Original text: 'Test your remote'
  remoteTestTip: undefined,

  // Original text: 'Test Remote'
  testRemote: undefined,

  // Original text: 'Test failed for {name}'
  remoteTestFailure: undefined,

  // Original text: 'Test passed for {name}'
  remoteTestSuccess: undefined,

  // Original text: 'Error'
  remoteTestError: undefined,

  // Original text: 'Test Step'
  remoteTestStep: undefined,

  // Original text: 'Test file'
  remoteTestFile: undefined,

  // Original text: 'Test name'
  remoteTestName: undefined,

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: undefined,

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: undefined,

  // Original text: 'Connection failed'
  remoteConnectionFailed: undefined,

  // Original text: 'Name'
  remoteName: undefined,

  // Original text: 'Path'
  remotePath: undefined,

  // Original text: 'State'
  remoteState: undefined,

  // Original text: 'Device'
  remoteDevice: undefined,

  // Original text: 'Share'
  remoteShare: undefined,

  // Original text: 'Action'
  remoteAction: undefined,

  // Original text: 'Auth'
  remoteAuth: undefined,

  // Original text: 'Mounted'
  remoteMounted: undefined,

  // Original text: 'Unmounted'
  remoteUnmounted: undefined,

  // Original text: 'Connect'
  remoteConnectTip: undefined,

  // Original text: 'Disconnect'
  remoteDisconnectTip: undefined,

  // Original text: 'Connected'
  remoteConnected: undefined,

  // Original text: 'Disconnected'
  remoteDisconnected: undefined,

  // Original text: 'Delete'
  remoteDeleteTip: undefined,

  // Original text: 'remote name *'
  remoteNamePlaceHolder: undefined,

  // Original text: 'Name *'
  remoteMyNamePlaceHolder: undefined,

  // Original text: '/path/to/backup'
  remoteLocalPlaceHolderPath: undefined,

  // Original text: 'host *'
  remoteNfsPlaceHolderHost: undefined,

  // Original text: 'path/to/backup'
  remoteNfsPlaceHolderPath: undefined,

  // Original text: 'subfolder [path\\to\\backup]'
  remoteSmbPlaceHolderRemotePath: undefined,

  // Original text: 'Username'
  remoteSmbPlaceHolderUsername: undefined,

  // Original text: 'Password'
  remoteSmbPlaceHolderPassword: undefined,

  // Original text: 'Domain'
  remoteSmbPlaceHolderDomain: undefined,

  // Original text: '<address>\\<share> *'
  remoteSmbPlaceHolderAddressShare: undefined,

  // Original text: 'password(fill to edit)'
  remotePlaceHolderPassword: undefined,

  // Original text: 'Create a new SR'
  newSrTitle: undefined,

  // Original text: "General"
  newSrGeneral: 'Geral',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Selecionar o tipo de armazenamento (storage)',

  // Original text: "Settings"
  newSrSettings: 'Configurações',

  // Original text: "Storage Usage"
  newSrUsage: 'Uso de armazenamento (storage)',

  // Original text: "Summary"
  newSrSummary: 'Sumário',

  // Original text: "Host"
  newSrHost: 'Host',

  // Original text: "Type"
  newSrType: 'Tipo',

  // Original text: "Name"
  newSrName: 'Nome',

  // Original text: "Description"
  newSrDescription: 'Descrição',

  // Original text: "Server"
  newSrServer: 'Servidor',

  // Original text: "Path"
  newSrPath: 'Caminho',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "with auth."
  newSrAuth: 'Com autenticação',

  // Original text: "User Name"
  newSrUsername: 'Nome de Usuário',

  // Original text: "Password"
  newSrPassword: 'Senha',

  // Original text: "Device"
  newSrDevice: 'Dispositivo',

  // Original text: "in use"
  newSrInUse: 'Em uso',

  // Original text: "Size"
  newSrSize: 'Tamanho',

  // Original text: "Create"
  newSrCreate: 'Criar',

  // Original text: 'Storage name'
  newSrNamePlaceHolder: undefined,

  // Original text: 'Storage description'
  newSrDescPlaceHolder: undefined,

  // Original text: 'Address'
  newSrAddressPlaceHolder: undefined,

  // Original text: '[port]'
  newSrPortPlaceHolder: undefined,

  // Original text: 'Username'
  newSrUsernamePlaceHolder: undefined,

  // Original text: 'Password'
  newSrPasswordPlaceHolder: undefined,

  // Original text: 'Device, e.g /dev/sda…'
  newSrLvmDevicePlaceHolder: undefined,

  // Original text: '/path/to/directory'
  newSrLocalPathPlaceHolder: undefined,

  // Original text: "Users/Groups"
  subjectName: 'Usuários/Grupos',

  // Original text: "Object"
  objectName: 'Objeto',

  // Original text: 'No acls found'
  aclNoneFound: undefined,

  // Original text: "Role"
  roleName: 'Função',

  // Original text: 'Create'
  aclCreate: undefined,

  // Original text: "New Group Name"
  newGroupName: 'Novo Nome de Grupo',

  // Original text: "Create Group"
  createGroup: 'Criar Grupo',

  // Original text: "Create"
  createGroupButton: 'Criar',

  // Original text: "Delete Group"
  deleteGroup: 'Deletar Grupo',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Você tem certeza que deseja deletar este grupo?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: 'Remover usuário do Grupo',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Você tem certeza que deseja deletar este usuário?',

  // Original text: 'Delete User'
  deleteUser: undefined,

  // Original text: 'no user'
  noUser: undefined,

  // Original text: "unknown user"
  unknownUser: 'Usuário desconhecido',

  // Original text: "No group found"
  noGroupFound: 'Grupo não encontrado',

  // Original text: "Name"
  groupNameColumn: 'Nome',

  // Original text: "Users"
  groupUsersColumn: 'Usuários',

  // Original text: "Add User"
  addUserToGroupColumn: 'Adicionar Usuário',

  // Original text: "Email"
  userNameColumn: 'e-mail',

  // Original text: "Permissions"
  userPermissionColumn: 'Permissões',

  // Original text: "Password"
  userPasswordColumn: 'Senha',

  // Original text: "Email"
  userName: 'e-mail',

  // Original text: "Password"
  userPassword: 'Senha',

  // Original text: "Create"
  createUserButton: 'Criar',

  // Original text: "No user found"
  noUserFound: 'Usuário não encontrado',

  // Original text: "User"
  userLabel: 'Usuário',

  // Original text: "Admin"
  adminLabel: 'Administrador',

  // Original text: "No user in group"
  noUserInGroup: 'Nenhum usuário neste grupo',

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users} user{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Selecionar Permissão',

  // Original text: 'No plugins found'
  noPlugins: undefined,

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Carregamento automático na inicialização do servidor',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Salvar configuração',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Deletar configuração',

  // Original text: "Plugin error"
  pluginError: 'Erro Plugin',

  // Original text: "Unknown error"
  unknownPluginError: 'Erro desconhecido',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Configuração de limpeza do plugin',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: 'Você tem certeza que deseja executar esta configuração?',

  // Original text: "Edit"
  editPluginConfiguration: 'Editar',

  // Original text: "Cancel"
  cancelPluginEdition: 'Cancelar',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Configuração do Plugin',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'Configuração do plugin foi efetuada com sucesso!',

  // Original text: 'Predefined configuration'
  pluginConfigurationPresetTitle: undefined,

  // Original text: 'Choose a predefined configuration.'
  pluginConfigurationChoosePreset: undefined,

  // Original text: 'Apply'
  applyPluginPreset: undefined,

  // Original text: 'Save filter error'
  saveNewUserFilterErrorTitle: undefined,

  // Original text: 'Bad parameter: name must be given.'
  saveNewUserFilterErrorBody: undefined,

  // Original text: 'Name:'
  filterName: undefined,

  // Original text: 'Value:'
  filterValue: undefined,

  // Original text: 'Save new filter'
  saveNewFilterTitle: undefined,

  // Original text: 'Set custom filters'
  setUserFiltersTitle: undefined,

  // Original text: 'Are you sure you want to set custom filters?'
  setUserFiltersBody: undefined,

  // Original text: 'Remove custom filter'
  removeUserFilterTitle: undefined,

  // Original text: 'Are you sure you want to remove custom filter?'
  removeUserFilterBody: undefined,

  // Original text: 'Default filter'
  defaultFilter: undefined,

  // Original text: 'Default filters'
  defaultFilters: undefined,

  // Original text: 'Custom filters'
  customFilters: undefined,

  // Original text: 'Customize filters'
  customizeFilters: undefined,

  // Original text: 'Save custom filters'
  saveCustomFilters: undefined,

  // Original text: "Start"
  startVmLabel: 'Iniciar',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Iniciar recuperação',

  // Original text: "Suspend"
  suspendVmLabel: 'Suspender',

  // Original text: "Stop"
  stopVmLabel: 'Parar',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'Forçar desligamento',

  // Original text: "Reboot"
  rebootVmLabel: 'Reiniciar',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Forçar reinicialização',

  // Original text: "Delete"
  deleteVmLabel: 'Deletar',

  // Original text: "Migrate"
  migrateVmLabel: 'Migrar',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Snapshot',

  // Original text: "Export"
  exportVmLabel: 'Exportar',

  // Original text: "Resume"
  resumeVmLabel: 'Continuar',

  // Original text: "Copy"
  copyVmLabel: 'Copiar',

  // Original text: "Clone"
  cloneVmLabel: 'Clonar',

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Clonagem rápida',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'Convertir para template',

  // Original text: "Console"
  vmConsoleLabel: 'Console',

  // Original text: 'Name'
  srUnhealthyVdiNameLabel: undefined,

  // Original text: 'Size'
  srUnhealthyVdiSize: undefined,

  // Original text: 'Depth'
  srUnhealthyVdiDepth: undefined,

  // Original text: 'VDI to coalesce ({total, number})'
  srUnhealthyVdiTitle: undefined,

  // Original text: "Rescan all disks"
  srRescan: 'Examinar novamente todos os discos',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Conectar-se a todos os hosts',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Desconectar-se de todos os hosts',

  // Original text: "Forget this SR"
  srForget: 'Esquecer esta SR',

  // Original text: 'Forget SRs'
  srsForget: undefined,

  // Original text: "Remove this SR"
  srRemoveButton: 'Remover esta SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'Nenhuma VDI neste armazenamento',

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: undefined,

  // Original text: '{used} used on {total}'
  poolRamUsage: undefined,

  // Original text: 'Master:'
  poolMaster: undefined,

  // Original text: 'Display all hosts of this pool'
  displayAllHosts: undefined,

  // Original text: 'Display all storages of this pool'
  displayAllStorages: undefined,

  // Original text: 'Display all VMs of this pool'
  displayAllVMs: undefined,

  // Original text: "Hosts"
  hostsTabName: 'Hosts',

  // Original text: 'Vms'
  vmsTabName: undefined,

  // Original text: 'Srs'
  srsTabName: undefined,

  // Original text: "High Availability"
  poolHaStatus: 'Alta Disponibilidade',

  // Original text: "Enabled"
  poolHaEnabled: 'Habilitado',

  // Original text: "Disabled"
  poolHaDisabled: 'Desativado',

  // Original text: 'Master'
  setpoolMaster: undefined,

  // Original text: 'GPU groups'
  poolGpuGroups: undefined,

  // Original text: "Name"
  hostNameLabel: 'Nome',

  // Original text: "Description"
  hostDescription: 'Descrição',

  // Original text: "Memory"
  hostMemory: 'Memória',

  // Original text: "No hosts"
  noHost: 'Nenhum host',

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: undefined,

  // Original text: 'PIF'
  pif: undefined,

  // Original text: "Name"
  poolNetworkNameLabel: 'Nome',

  // Original text: "Description"
  poolNetworkDescription: 'Descrição',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: "No networks"
  poolNoNetwork: 'Nenhuma Rede',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Conectado',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Desconectado',

  // Original text: 'Show PIFs'
  showPifs: undefined,

  // Original text: 'Hide PIFs'
  hidePifs: undefined,

  // Original text: 'Show details'
  showDetails: undefined,

  // Original text: 'Hide details'
  hideDetails: undefined,

  // Original text: 'No stats'
  poolNoStats: undefined,

  // Original text: 'All hosts'
  poolAllHosts: undefined,

  // Original text: "Add SR"
  addSrLabel: 'Adicionar SR',

  // Original text: "Add VM"
  addVmLabel: 'Adicionar VM',

  // Original text: "Add Host"
  addHostLabel: 'Adicionar Host',

  // Original text: 'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.'
  hostNeedsPatchUpdate: undefined,

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: undefined,

  // Original text: 'Adding host failed'
  addHostErrorTitle: undefined,

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: undefined,

  // Original text: "Disconnect"
  disconnectServer: 'Desconectar',

  // Original text: "Start"
  startHostLabel: 'Iniciar',

  // Original text: "Stop"
  stopHostLabel: 'Parar',

  // Original text: "Enable"
  enableHostLabel: 'Habilitar',

  // Original text: "Disable"
  disableHostLabel: 'Desabilitar',

  // Original text: "Restart toolstack"
  restartHostAgent: 'Reiniciar toolstack',

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Forçar reinicialização',

  // Original text: "Reboot"
  rebootHostLabel: 'Reinicializar',

  // Original text: 'Error while restarting host'
  noHostsAvailableErrorTitle: undefined,

  // Original text: 'Some VMs cannot be migrated before restarting this host. Please try force reboot.'
  noHostsAvailableErrorMessage: undefined,

  // Original text: 'Error while restarting hosts'
  failHostBulkRestartTitle: undefined,

  // Original text: '{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted.'
  failHostBulkRestartMessage: undefined,

  // Original text: 'Reboot to apply updates'
  rebootUpdateHostLabel: undefined,

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Modo de emergência',

  // Original text: "Storage"
  storageTabName: 'Armazenamento',

  // Original text: "Patches"
  patchesTabName: 'Correções',

  // Original text: "Load average"
  statLoad: 'Carregar média',

  // Original text: 'RAM Usage: {memoryUsed}'
  memoryHostState: undefined,

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Hardware',

  // Original text: "Address"
  hostAddress: 'Endereço',

  // Original text: "Status"
  hostStatus: 'Status',

  // Original text: "Build number"
  hostBuildNumber: 'Número de compilação',

  // Original text: "iSCSI name"
  hostIscsiName: 'Nome iSCSI',

  // Original text: "Version"
  hostXenServerVersion: 'Versão',

  // Original text: "Enabled"
  hostStatusEnabled: 'Ativado',

  // Original text: "Disabled"
  hostStatusDisabled: 'Desativado',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Modo de energia',

  // Original text: "Host uptime"
  hostStartedSince: 'Tempo de atividade do Host',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Tempo de atividade Toolstack',

  // Original text: "CPU model"
  hostCpusModel: 'Modelo CPU',

  // Original text: 'GPUs'
  hostGpus: undefined,

  // Original text: "Core (socket)"
  hostCpusNumber: 'Núcleo (soquete)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Informações do Fabricante',

  // Original text: "BIOS info"
  hostBiosinfo: 'Informações BIOS',

  // Original text: "License"
  licenseHostSettingsLabel: 'Licença',

  // Original text: "Type"
  hostLicenseType: 'Tipo',

  // Original text: "Socket"
  hostLicenseSocket: 'Soquete',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Expiração',

  // Original text: 'Installed supplemental packs'
  supplementalPacks: undefined,

  // Original text: 'Install new supplemental pack'
  supplementalPackNew: undefined,

  // Original text: 'Install supplemental pack on every host'
  supplementalPackPoolNew: undefined,

  // Original text: '{name} (by {author})'
  supplementalPackTitle: undefined,

  // Original text: 'Installation started'
  supplementalPackInstallStartedTitle: undefined,

  // Original text: 'Installing new supplemental pack…'
  supplementalPackInstallStartedMessage: undefined,

  // Original text: 'Installation error'
  supplementalPackInstallErrorTitle: undefined,

  // Original text: 'The installation of the supplemental pack failed.'
  supplementalPackInstallErrorMessage: undefined,

  // Original text: 'Installation success'
  supplementalPackInstallSuccessTitle: undefined,

  // Original text: 'Supplemental pack successfully installed.'
  supplementalPackInstallSuccessMessage: undefined,

  // Original text: "Add a network"
  networkCreateButton: 'Adicionar a Rede',

  // Original text: 'Add a bonded network'
  networkCreateBondedButton: undefined,

  // Original text: "Device"
  pifDeviceLabel: 'Dispositivo',

  // Original text: "Network"
  pifNetworkLabel: 'Rede',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Endereço',

  // Original text: 'Mode'
  pifModeLabel: undefined,

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: 'Status',

  // Original text: "Connected"
  pifStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Desconectado',

  // Original text: "No physical interface detected"
  pifNoInterface: 'Nenhuma interface física foi detectada',

  // Original text: 'This interface is currently in use'
  pifInUse: undefined,

  // Original text: 'Action'
  pifAction: undefined,

  // Original text: 'Default locking mode'
  defaultLockingMode: undefined,

  // Original text: 'Configure IP address'
  pifConfigureIp: undefined,

  // Original text: 'Invalid parameters'
  configIpErrorTitle: undefined,

  // Original text: 'IP address and netmask required'
  configIpErrorMessage: undefined,

  // Original text: 'Static IP address'
  staticIp: undefined,

  // Original text: 'Netmask'
  netmask: undefined,

  // Original text: 'DNS'
  dns: undefined,

  // Original text: 'Gateway'
  gateway: undefined,

  // Original text: "Add a storage"
  addSrDeviceButton: 'Adicionar um armazenamento',

  // Original text: "Name"
  srNameLabel: 'Nome',

  // Original text: "Type"
  srType: 'Tipo',

  // Original text: 'Action'
  pbdAction: undefined,

  // Original text: "Status"
  pbdStatus: 'Status',

  // Original text: "Connected"
  pbdStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Desconectado',

  // Original text: 'Connect'
  pbdConnect: undefined,

  // Original text: 'Disconnect'
  pbdDisconnect: undefined,

  // Original text: 'Forget'
  pbdForget: undefined,

  // Original text: "Shared"
  srShared: 'Compartilhado',

  // Original text: "Not shared"
  srNotShared: 'Não compartilhado',

  // Original text: "No storage detected"
  pbdNoSr: 'Nenhum armazenamento detectado',

  // Original text: "Name"
  patchNameLabel: 'Nome',

  // Original text: "Install all patches"
  patchUpdateButton: 'Instalar todas as correções',

  // Original text: "Description"
  patchDescription: 'Descrição',

  // Original text: "Applied date"
  patchApplied: 'Data de lançamento',

  // Original text: "Size"
  patchSize: 'Tamanho',

  // Original text: "Status"
  patchStatus: 'Status',

  // Original text: "Applied"
  patchStatusApplied: 'Aplicado',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Correções faltando',

  // Original text: "No patches detected"
  patchNothing: 'Nenhuma correção foi detectada',

  // Original text: "Release date"
  patchReleaseDate: 'Data de lançamento',

  // Original text: "Guidance"
  patchGuidance: 'Direção',

  // Original text: "Action"
  patchAction: 'Ação',

  // Original text: 'Applied patches'
  hostAppliedPatches: undefined,

  // Original text: "Missing patches"
  hostMissingPatches: 'Correções faltando',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Host pronto para atualizar!',

  // Original text: 'Non-recommended patch install'
  installPatchWarningTitle: undefined,

  // Original text: 'This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway'
  installPatchWarningContent: undefined,

  // Original text: 'Go to pool'
  installPatchWarningReject: undefined,

  // Original text: 'Install'
  installPatchWarningResolve: undefined,

  // Original text: 'Refresh patches'
  refreshPatches: undefined,

  // Original text: 'Install pool patches'
  installPoolPatches: undefined,

  // Original text: 'Default SR'
  defaultSr: undefined,

  // Original text: 'Set as default SR'
  setAsDefaultSr: undefined,

  // Original text: "General"
  generalTabName: 'Geral',

  // Original text: "Stats"
  statsTabName: 'Estatísticas',

  // Original text: "Console"
  consoleTabName: 'Console',

  // Original text: 'Container'
  containersTabName: undefined,

  // Original text: "Snapshots"
  snapshotsTabName: 'Snapshots',

  // Original text: "Logs"
  logsTabName: 'Logs',

  // Original text: "Advanced"
  advancedTabName: 'Avançado',

  // Original text: "Network"
  networkTabName: 'Rede',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Disco{disks, plural, one {} other {s}}',

  // Original text: "halted"
  powerStateHalted: 'Interrompido',

  // Original text: "running"
  powerStateRunning: 'Executando',

  // Original text: "suspended"
  powerStateSuspended: 'Suspendido',

  // Original text: "No Xen tools detected"
  vmStatus: 'Nenhum Xen tools foi detectado',

  // Original text: "No IPv4 record"
  vmName: 'Nenhum registro IPv4',

  // Original text: "No IP record"
  vmDescription: 'Nenhum registro IP',

  // Original text: "Started {ago}"
  vmSettings: 'Iniciado {ago}',

  // Original text: "Current status:"
  vmCurrentStatus: 'Status atual',

  // Original text: "Not running"
  vmNotRunning: 'Parado',

  // Original text: 'Halted {ago}'
  vmHaltedSince: undefined,

  // Original text: "No Xen tools detected"
  noToolsDetected: 'Nenhum Xen tools foi detectado',

  // Original text: "No IPv4 record"
  noIpv4Record: 'Nenhum registro IPv4',

  // Original text: "No IP record"
  noIpRecord: 'Nenhum registro IP',

  // Original text: "Started {ago}"
  started: 'Iniciado {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: 'Paravirtualização',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: 'Virtualização de Hadware (HVM)',

  // Original text: "CPU usage"
  statsCpu: 'Uso de CPU',

  // Original text: "Memory usage"
  statsMemory: 'Uso de Memória',

  // Original text: "Network throughput"
  statsNetwork: 'Taxa de transferência de Rede',

  // Original text: 'Stacked values'
  useStackedValuesOnStats: undefined,

  // Original text: "Disk throughput"
  statDisk: 'Taxa de transferência de Disco',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Últimos 10 minutos',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Últimas 2 horas',

  // Original text: "Last week"
  statLastWeek: 'Semana passada',

  // Original text: "Last year"
  statLastYear: 'Ano passado',

  // Original text: "Copy"
  copyToClipboardLabel: 'Copiar',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: "Tip:"
  tipLabel: 'Dica',

  // Original text: 'Hide infos'
  hideHeaderTooltip: undefined,

  // Original text: 'Show infos'
  showHeaderTooltip: undefined,

  // Original text: 'Name'
  containerName: undefined,

  // Original text: 'Command'
  containerCommand: undefined,

  // Original text: 'Creation date'
  containerCreated: undefined,

  // Original text: 'Status'
  containerStatus: undefined,

  // Original text: 'Action'
  containerAction: undefined,

  // Original text: 'No existing containers'
  noContainers: undefined,

  // Original text: 'Stop this container'
  containerStop: undefined,

  // Original text: 'Start this container'
  containerStart: undefined,

  // Original text: 'Pause this container'
  containerPause: undefined,

  // Original text: 'Resume this container'
  containerResume: undefined,

  // Original text: 'Restart this container'
  containerRestart: undefined,

  // Original text: "Action"
  vdiAction: 'Ação',

  // Original text: "Attach disk"
  vdiAttachDeviceButton: 'Anexar disco',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Novo disco',

  // Original text: "Boot order"
  vdiBootOrder: 'Ordem de boot',

  // Original text: "Name"
  vdiNameLabel: 'Nome',

  // Original text: "Description"
  vdiNameDescription: 'Descrição',

  // Original text: 'Pool'
  vdiPool: undefined,

  // Original text: 'Disconnect'
  vdiDisconnect: undefined,

  // Original text: "Tags"
  vdiTags: 'Etiquetas',

  // Original text: "Size"
  vdiSize: 'Tamanho',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: 'VM'
  vdiVm: undefined,

  // Original text: 'Migrate VDI'
  vdiMigrate: undefined,

  // Original text: 'Destination SR:'
  vdiMigrateSelectSr: undefined,

  // Original text: 'Migrate all VDIs'
  vdiMigrateAll: undefined,

  // Original text: 'No SR'
  vdiMigrateNoSr: undefined,

  // Original text: 'A target SR is required to migrate a VDI'
  vdiMigrateNoSrMessage: undefined,

  // Original text: 'Forget'
  vdiForget: undefined,

  // Original text: 'Remove VDI'
  vdiRemove: undefined,

  // Original text: 'No VDIs attached to Control Domain'
  noControlDomainVdis: undefined,

  // Original text: "Boot flag"
  vbdBootableStatus: 'Indicador de inicialização',

  // Original text: "Status"
  vbdStatus: 'Status',

  // Original text: "Connected"
  vbdStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Desconectado',

  // Original text: "No disks"
  vbdNoVbd: 'Nenhum disco encontrado',

  // Original text: 'Connect VBD'
  vbdConnect: undefined,

  // Original text: 'Disconnect VBD'
  vbdDisconnect: undefined,

  // Original text: 'Bootable'
  vbdBootable: undefined,

  // Original text: 'Readonly'
  vbdReadonly: undefined,

  // Original text: 'Action'
  vbdAction: undefined,

  // Original text: 'Create'
  vbdCreate: undefined,

  // Original text: 'Attach'
  vbdAttach: undefined,

  // Original text: 'Disk name'
  vbdNamePlaceHolder: undefined,

  // Original text: 'Size'
  vbdSizePlaceHolder: undefined,

  // Original text: 'CD drive not completely installed'
  cdDriveNotInstalled: undefined,

  // Original text: 'Stop and start the VM to install the CD drive'
  cdDriveInstallation: undefined,

  // Original text: 'Save'
  saveBootOption: undefined,

  // Original text: 'Reset'
  resetBootOption: undefined,

  // Original text: 'Delete selected VDIs'
  deleteSelectedVdis: undefined,

  // Original text: 'Delete selected VDI'
  deleteSelectedVdi: undefined,

  // Original text: 'Creating this disk will use the disk space quota from the resource set {resourceSet} ({spaceLeft} left)'
  useQuotaWarning: undefined,

  // Original text: 'Not enough space in resource set {resourceSet} ({spaceLeft} left)'
  notEnoughSpaceInResourceSet: undefined,

  // Original text: "New device"
  vifCreateDeviceButton: 'Novo dispositivo',

  // Original text: "No interface"
  vifNoInterface: 'Nenhuma interface encontrada',

  // Original text: "Device"
  vifDeviceLabel: 'Dispositivo',

  // Original text: "MAC address"
  vifMacLabel: 'Endereço MAC',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Rede',

  // Original text: "Status"
  vifStatusLabel: 'Status',

  // Original text: "Connected"
  vifStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Desconectado',

  // Original text: 'Connect'
  vifConnect: undefined,

  // Original text: 'Disconnect'
  vifDisconnect: undefined,

  // Original text: 'Remove'
  vifRemove: undefined,

  // Original text: 'Remove selected VIFs'
  vifsRemove: undefined,

  // Original text: "IP addresses"
  vifIpAddresses: 'Endereço IP',

  // Original text: 'Auto-generated if empty'
  vifMacAutoGenerate: undefined,

  // Original text: 'Allowed IPs'
  vifAllowedIps: undefined,

  // Original text: 'No IPs'
  vifNoIps: undefined,

  // Original text: 'Network locked'
  vifLockedNetwork: undefined,

  // Original text: 'Network locked and no IPs are allowed for this interface'
  vifLockedNetworkNoIps: undefined,

  // Original text: 'Network not locked'
  vifUnLockedNetwork: undefined,

  // Original text: 'Unknown network'
  vifUnknownNetwork: undefined,

  // Original text: 'Action'
  vifAction: undefined,

  // Original text: 'Create'
  vifCreate: undefined,

  // Original text: "No snapshots"
  noSnapshots: 'Nenhum snapshot encontrado',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Novo snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Clique sobre o botão snapshop para criar!',

  // Original text: 'Revert VM to this snapshot'
  revertSnapshot: undefined,

  // Original text: 'Remove this snapshot'
  deleteSnapshot: undefined,

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: undefined,

  // Original text: 'Export this snapshot'
  exportSnapshot: undefined,

  // Original text: "Creation date"
  snapshotDate: 'Data de criação',

  // Original text: "Name"
  snapshotName: 'Nome',

  // Original text: 'Description'
  snapshotDescription: undefined,

  // Original text: "Action"
  snapshotAction: 'Ação',

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: undefined,

  // Original text: "Remove all logs"
  logRemoveAll: 'Remover todos os logs',

  // Original text: "No logs so far"
  noLogs: 'Sem registros até o momento',

  // Original text: "Creation date"
  logDate: 'Data de criação',

  // Original text: "Name"
  logName: 'Nome',

  // Original text: "Content"
  logContent: 'Conteúdo',

  // Original text: "Action"
  logAction: 'Ação',

  // Original text: "Remove"
  vmRemoveButton: 'Remover',

  // Original text: "Convert"
  vmConvertButton: 'Converter',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Configurações Xen',

  // Original text: "Guest OS"
  guestOsLabel: 'Convidado OS',

  // Original text: "Misc"
  miscLabel: 'Misc',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Modo de virtualização',

  // Original text: "CPU weight"
  cpuWeightLabel: 'Carga da CPU',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'Padrão',

  // Original text: 'CPU cap'
  cpuCapLabel: undefined,

  // Original text: 'Default ({value, number})'
  defaultCpuCap: undefined,

  // Original text: "PV args"
  pvArgsLabel: 'PV argos',

  // Original text: "Xen tools status"
  xenToolsStatus: 'Status de ferramentas Xen',

  // Original text: "{status}"
  xenToolsStatusValue: '{status}',

  // Original text: "OS name"
  osName: 'Nome OS',

  // Original text: "OS kernel"
  osKernel: 'OS kernel (núcleo)',

  // Original text: "Auto power on"
  autoPowerOn: 'Ligar automaticamente',

  // Original text: "HA"
  ha: 'HA',

  // Original text: 'Affinity host'
  vmAffinityHost: undefined,

  // Original text: 'VGA'
  vmVga: undefined,

  // Original text: 'Video RAM'
  vmVideoram: undefined,

  // Original text: 'None'
  noAffinityHost: undefined,

  // Original text: "Original template"
  originalTemplate: 'Modelo original (template)',

  // Original text: "Unknown"
  unknownOsName: 'Desconhecido',

  // Original text: "Unknown"
  unknownOsKernel: 'Desconhecido',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Desconhecido',

  // Original text: "VM limits"
  vmLimitsLabel: 'Limites de VM',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'Limites de CPU',

  // Original text: 'Topology'
  vmCpuTopology: undefined,

  // Original text: 'Default behavior'
  vmChooseCoresPerSocket: undefined,

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmCoresPerSocket: undefined,

  // Original text: 'None'
  vmCoresPerSocketNone: undefined,

  // Original text: 'Incorrect cores per socket value'
  vmCoresPerSocketIncorrectValue: undefined,

  // Original text: 'Please change the selected value to fix it.'
  vmCoresPerSocketIncorrectValueSolution: undefined,

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Limites de memória (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'máximo',

  // Original text: "Memory max:"
  vmMaxRam: 'Limite máximo de memória',

  // Original text: 'vGPU'
  vmVgpu: undefined,

  // Original text: 'GPUs'
  vmVgpus: undefined,

  // Original text: 'None'
  vmVgpuNone: undefined,

  // Original text: 'Add vGPU'
  vmAddVgpu: undefined,

  // Original text: 'Select vGPU type'
  vmSelectVgpuType: undefined,

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Faça um longo clique para adicionar um nome',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Faça um longo clique para adicionar uma descrição',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Clique para adicionar um nome',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Clique para adicionar uma descrição',

  // Original text: 'Click to add a name'
  templateHomeNamePlaceholder: undefined,

  // Original text: 'Click to add a description'
  templateHomeDescriptionPlaceholder: undefined,

  // Original text: 'Delete template'
  templateDelete: undefined,

  // Original text: 'Delete VM template{templates, plural, one {} other {s}}'
  templateDeleteModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?'
  templateDeleteModalBody: undefined,

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Pool{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Host{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'Utilização RAM',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'Utilização de CPU',

  // Original text: "VMs Power state"
  vmStatePanel: 'Estado de energia das VMs',

  // Original text: "Pending tasks"
  taskStatePanel: 'Tarefas pendentes',

  // Original text: "Users"
  usersStatePanel: 'Usuários',

  // Original text: "Storage state"
  srStatePanel: 'Data do armazenamento (storage)',

  // Original text: "{usage} (of {total})"
  ofUsage: 'de',

  // Original text: "No storage"
  noSrs: 'Nenhum armazenamento (storage)',

  // Original text: "Name"
  srName: 'Nome',

  // Original text: "Pool"
  srPool: 'Pool',

  // Original text: "Host"
  srHost: 'Host',

  // Original text: "Type"
  srFormat: 'Tipo',

  // Original text: "Size"
  srSize: 'Tamanho',

  // Original text: "Usage"
  srUsage: 'Utilização',

  // Original text: "used"
  srUsed: 'Usado',

  // Original text: "free"
  srFree: 'Livre',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Utilização atual de armazenamento',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: 'Top 5 de Utilização SR (em %)',

  // Original text: '{running, number} running ({halted, number} halted)'
  vmsStates: undefined,

  // Original text: 'Clear selection'
  dashboardStatsButtonRemoveAll: undefined,

  // Original text: 'Add all hosts'
  dashboardStatsButtonAddAllHost: undefined,

  // Original text: 'Add all VMs'
  dashboardStatsButtonAddAllVM: undefined,

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'Nenhum dado encontrado',

  // Original text: 'Weekly Heatmap'
  weeklyHeatmap: undefined,

  // Original text: 'Weekly Charts'
  weeklyCharts: undefined,

  // Original text: 'Synchronize scale:'
  weeklyChartsScaleInfo: undefined,

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Erro de estatísticas',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Não há estatísticas disponíveis para:',

  // Original text: "No selected metric"
  noSelectedMetric: 'Nenhuma métrica selecionada',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Selecionar',

  // Original text: "Loading…"
  metricsLoading: 'Carregando…',

  // Original text: "Coming soon!"
  comingSoon: 'Em breve!',

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: 'VDI órfãs',

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'VMs órfãs',

  // Original text: "No orphans"
  noOrphanedObject: 'Sem órfãs',

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: 'Remover todos as VDIs órfãs',

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: undefined,

  // Original text: "Name"
  vmNameLabel: 'Nome',

  // Original text: "Description"
  vmNameDescription: 'Descrição',

  // Original text: "Resident on"
  vmContainer: 'Residente em',

  // Original text: "Alarms"
  alarmMessage: 'Alarmes',

  // Original text: "No alarms"
  noAlarms: 'Sem alarmes',

  // Original text: "Date"
  alarmDate: 'Data',

  // Original text: "Content"
  alarmContent: 'Conteúdo',

  // Original text: "Issue on"
  alarmObject: 'Tipo de alarme',

  // Original text: "Pool"
  alarmPool: 'Pool',

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Remover todos os alarmes',

  // Original text: '{used}% used ({free} left)'
  spaceLeftTooltip: undefined,

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: 'Criar uma nova VM em {pool}',

  // Original text: 'You have no permission to create a VM'
  newVmCreateNewVmNoPermission: undefined,

  // Original text: "Infos"
  newVmInfoPanel: 'Informações',

  // Original text: "Name"
  newVmNameLabel: 'Nome',

  // Original text: "Template"
  newVmTemplateLabel: 'Modelo (Template)',

  // Original text: "Description"
  newVmDescriptionLabel: 'Descrição',

  // Original text: "Performances"
  newVmPerfPanel: 'Desempenho',

  // Original text: "vCPUs"
  newVmVcpusLabel: 'vCPUs',

  // Original text: "RAM"
  newVmRamLabel: 'RAM',

  // Original text: 'Static memory max'
  newVmStaticMaxLabel: undefined,

  // Original text: 'Dynamic memory min'
  newVmDynamicMinLabel: undefined,

  // Original text: 'Dynamic memory max'
  newVmDynamicMaxLabel: undefined,

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Definições de instalação',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Rede',

  // Original text: 'e.g: http://httpredir.debian.org/debian'
  newVmInstallNetworkPlaceHolder: undefined,

  // Original text: "PV Args"
  newVmPvArgsLabel: 'PV argos',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'Interfaces',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: 'Adicionar uma interface',

  // Original text: "Disks"
  newVmDisksPanel: 'Discos',

  // Original text: "SR"
  newVmSrLabel: 'SR',

  // Original text: "Size"
  newVmSizeLabel: 'Tamanho',

  // Original text: "Add disk"
  newVmAddDisk: 'Adicionar disco',

  // Original text: "Summary"
  newVmSummaryPanel: 'Sumário',

  // Original text: "Create"
  newVmCreate: 'Criar',

  // Original text: "Reset"
  newVmReset: 'Reiniciar',

  // Original text: "Select template"
  newVmSelectTemplate: 'Selecionar modelo (template)',

  // Original text: "SSH key"
  newVmSshKey: 'Chave SSH',

  // Original text: "Config drive"
  newVmConfigDrive: 'Configuração do drive',

  // Original text: "Custom config"
  newVmCustomConfig: 'Configuração personalizada',

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: 'Inicializar VM após sua criação',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Auto-gerada se vazio',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'Carga da CPU',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuWeight: undefined,

  // Original text: 'CPU cap'
  newVmCpuCapLabel: undefined,

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: undefined,

  // Original text: "Cloud config"
  newVmCloudConfig: 'Configuração do Cloud',

  // Original text: "Create VMs"
  newVmCreateVms: 'Criar VMs',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: 'Você tem certeza que deseja criar {nbVms} VMs?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Multiplas VMs',

  // Original text: 'Select a resource set:'
  newVmSelectResourceSet: undefined,

  // Original text: 'Name pattern:'
  newVmMultipleVmsPattern: undefined,

  // Original text: 'e.g.: \\{name\\}_%'
  newVmMultipleVmsPatternPlaceholder: undefined,

  // Original text: 'First index:'
  newVmFirstIndex: undefined,

  // Original text: 'Recalculate VMs number'
  newVmNumberRecalculate: undefined,

  // Original text: 'Refresh VMs name'
  newVmNameRefresh: undefined,

  // Original text: 'Affinity host'
  newVmAffinityHost: undefined,

  // Original text: 'Advanced'
  newVmAdvancedPanel: undefined,

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: undefined,

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: undefined,

  // Original text: 'Share this VM'
  newVmShare: undefined,

  // Original text: "Resource sets"
  resourceSets: 'Ajustes de recursos',

  // Original text: 'No resource sets.'
  noResourceSets: undefined,

  // Original text: 'Loading resource sets'
  loadingResourceSets: undefined,

  // Original text: "Resource set name"
  resourceSetName: 'Ajuste de nome do recurso',

  // Original text: 'Users'
  resourceSetUsers: undefined,

  // Original text: 'Pools'
  resourceSetPools: undefined,

  // Original text: 'Templates'
  resourceSetTemplates: undefined,

  // Original text: 'SRs'
  resourceSetSrs: undefined,

  // Original text: 'Networks'
  resourceSetNetworks: undefined,

  // Original text: 'Recompute all limits'
  recomputeResourceSets: undefined,

  // Original text: "Save"
  saveResourceSet: 'Salvar',

  // Original text: "Reset"
  resetResourceSet: 'Redefinir',

  // Original text: "Edit"
  editResourceSet: 'Editar',

  // Original text: "Delete"
  deleteResourceSet: 'Deletar',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Deletar grupo de recurso',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: 'Você tem certeza que deseja deletar este ajuste?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Objetos faltando',

  // Original text: "vCPUs"
  resourceSetVcpus: 'vCPUs',

  // Original text: "Memory"
  resourceSetMemory: 'Memória',

  // Original text: "Storage"
  resourceSetStorage: 'Armazenamento (Storage)',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Desconhecido',

  // Original text: "Available hosts"
  availableHosts: 'Hosts disponiveis',

  // Original text: "Excluded hosts"
  excludedHosts: 'Hosts excluídos',

  // Original text: "No hosts available."
  noHostsAvailable: 'Sem hosts disponiveis',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'VMs criadas a partir desse conjunto de recursos deve ser executado nos hosts indicados.',

  // Original text: "Maximum CPUs"
  maxCpus: 'Limite de CPUs',

  // Original text: "Maximum RAM"
  maxRam: 'Limite de RAM (GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Limite de espaço de disco',

  // Original text: 'IP pool'
  ipPool: undefined,

  // Original text: 'Quantity'
  quantity: undefined,

  // Original text: "No limits."
  noResourceSetLimits: 'Sem limites',

  // Original text: "Total:"
  totalResource: 'Total',

  // Original text: "Remaining:"
  remainingResource: 'Restando;',

  // Original text: "Used:"
  usedResource: 'Usado:',

  // Original text: 'New'
  resourceSetNew: undefined,

  // Original text: "Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files."
  importVmsList: 'Tente soltar alguns backups aqui, ou clique para selecionar os backups para que seja feito o upload. Apenas arquivos .xva são aceitos.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Nenhuma VM selecionada',

  // Original text: "To Pool:"
  vmImportToPool: 'Enviar para Pool:',

  // Original text: "To SR:"
  vmImportToSr: 'Enviar para SR:',

  // Original text: "VMs to import"
  vmsToImport: 'Importar VMs',

  // Original text: "Reset"
  importVmsCleanList: 'Reiniciar',

  // Original text: "VM import success"
  vmImportSuccess: 'Importação feita com sucesso',

  // Original text: "VM import failed"
  vmImportFailed: 'Falha na importação',

  // Original text: "Import starting…"
  startVmImport: 'Iniciando importação…',

  // Original text: "Export starting…"
  startVmExport: 'Iniciando exportação…',

  // Original text: 'N CPUs'
  nCpus: undefined,

  // Original text: 'Memory'
  vmMemory: undefined,

  // Original text: 'Disk {position} ({capacity})'
  diskInfo: undefined,

  // Original text: 'Disk description'
  diskDescription: undefined,

  // Original text: 'No disks.'
  noDisks: undefined,

  // Original text: 'No networks.'
  noNetworks: undefined,

  // Original text: 'Network {name}'
  networkInfo: undefined,

  // Original text: 'No description available'
  noVmImportErrorDescription: undefined,

  // Original text: 'Error:'
  vmImportError: undefined,

  // Original text: '{type} file:'
  vmImportFileType: undefined,

  // Original text: 'Please to check and/or modify the VM configuration.'
  vmImportConfigAlert: undefined,

  // Original text: "No pending tasks"
  noTasks: 'Nenhuma tarefa pendente',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'Atualmente nenhuma tarefa esta pendente no XenServer',

  // Original text: 'Schedules'
  backupSchedules: undefined,

  // Original text: 'Get remote'
  getRemote: undefined,

  // Original text: 'List Remote'
  listRemote: undefined,

  // Original text: 'simple'
  simpleBackup: undefined,

  // Original text: "delta"
  delta: 'delta',

  // Original text: "Restore Backups"
  restoreBackups: 'Recuperação de Backups',

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: undefined,

  // Original text: 'Only the files of Delta Backup which are not on a SMB remote can be restored'
  restoreDeltaBackupsInfo: undefined,

  // Original text: "Enabled"
  remoteEnabled: 'Habilitado',

  // Original text: "Error"
  remoteError: 'erro',

  // Original text: "No backup available"
  noBackup: 'Nenhum backup disponível',

  // Original text: 'VM Name'
  backupVmNameColumn: undefined,

  // Original text: 'Tags'
  backupTags: undefined,

  // Original text: 'Last Backup'
  lastBackupColumn: undefined,

  // Original text: 'Available Backups'
  availableBackupsColumn: undefined,

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: undefined,

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: undefined,

  // Original text: 'Select default SR…'
  backupRestoreSelectDefaultSr: undefined,

  // Original text: 'Choose a SR for each VDI'
  backupRestoreChooseSrForEachVdis: undefined,

  // Original text: 'VDI'
  backupRestoreVdiLabel: undefined,

  // Original text: 'SR'
  backupRestoreSrLabel: undefined,

  // Original text: 'Display backups'
  displayBackup: undefined,

  // Original text: 'Import VM'
  importBackupTitle: undefined,

  // Original text: 'Starting your backup import'
  importBackupMessage: undefined,

  // Original text: 'VMs to backup'
  vmsToBackup: undefined,

  // Original text: 'List remote backups'
  listRemoteBackups: undefined,

  // Original text: 'Restore backup files'
  restoreFiles: undefined,

  // Original text: 'Invalid options'
  restoreFilesError: undefined,

  // Original text: 'Restore file from {name}'
  restoreFilesFromBackup: undefined,

  // Original text: 'Select a backup…'
  restoreFilesSelectBackup: undefined,

  // Original text: 'Select a disk…'
  restoreFilesSelectDisk: undefined,

  // Original text: 'Select a partition…'
  restoreFilesSelectPartition: undefined,

  // Original text: 'Folder path'
  restoreFilesSelectFolderPath: undefined,

  // Original text: 'Select a file…'
  restoreFilesSelectFiles: undefined,

  // Original text: 'Content not found'
  restoreFileContentNotFound: undefined,

  // Original text: 'No files selected'
  restoreFilesNoFilesSelected: undefined,

  // Original text: 'Selected files ({files}):'
  restoreFilesSelectedFiles: undefined,

  // Original text: 'Error while scanning disk'
  restoreFilesDiskError: undefined,

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: undefined,

  // Original text: 'Unselect all files'
  restoreFilesUnselectAll: undefined,

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  emergencyShutdownHostsModalMessage: undefined,

  // Original text: "Shutdown host"
  stopHostModalTitle: 'Desligar host',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage: 'O host será desligado. Você tem certeza que deseja continuar?',

  // Original text: 'Add host'
  addHostModalTitle: undefined,

  // Original text: 'Are you sure you want to add {host} to {pool}?'
  addHostModalMessage: undefined,

  // Original text: "Restart host"
  restartHostModalTitle: 'Reiniciar host',

  // Original text: "This will restart your host. Do you want to continue?"
  restartHostModalMessage: 'O host será reiniciado. Você tem certeza que deseja continuar?',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}'
  restartHostsAgentsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: undefined,

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Iniciar VM{vms, plural, one {} other {s}}',

  // Original text: 'Start a copy'
  cloneAndStartVM: undefined,

  // Original text: 'Force start'
  forceStartVm: undefined,

  // Original text: 'Forbidden operation'
  forceStartVmModalTitle: undefined,

  // Original text: 'Start operation for this vm is blocked.'
  blockedStartVmModalMessage: undefined,

  // Original text: 'Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}.'
  blockedStartVmsModalMessage: undefined,

  // Original text: "Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Você tem certeza que deseja iniciar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage: undefined,

  // Original text: 'Start failed'
  failedVmsErrorTitle: undefined,

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: undefined,

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Parar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Você tem certeza que deseja parar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Restart VM"
  restartVmModalTitle: 'Reiniciar VM',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: 'Você tem certeza que deseja reiniciar {name}?',

  // Original text: "Stop VM"
  stopVmModalTitle: 'Parar VM',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: 'Você tem certeza que deseja parar {name}?',

  // Original text: 'Suspend VM{vms, plural, one {} other {s}}'
  suspendVmsModalTitle: undefined,

  // Original text: 'Are you sure you want to suspend {vms, number} VM{vms, plural, one {} other {s}}?'
  suspendVmsModalMessage: undefined,

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Reiniciar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Você tem certeza que deseja reiniciar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Você tem certeza que deseja executar snapshop para {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Deletar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage: 'Você tem certeza que deseja deletar {vms} VM{vms, plural, one {} other {s}}? Todos os discos de VM serão removidos',

  // Original text: 'delete {nVms, number} vm{nVms, plural, one {} other {s}}'
  deleteVmsConfirmText: undefined,

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Deletar VM',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: 'Você tem certeza que deseja deletar esta VM? Todos os discos de VM serão removidos',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Migrar VM',

  // Original text: 'Select a destination host:'
  migrateVmSelectHost: undefined,

  // Original text: 'Select a migration network:'
  migrateVmSelectMigrationNetwork: undefined,

  // Original text: 'For each VIF, select a network:'
  migrateVmSelectNetworks: undefined,

  // Original text: 'Select a destination SR:'
  migrateVmsSelectSr: undefined,

  // Original text: 'Select a destination SR for local disks:'
  migrateVmsSelectSrIntraPool: undefined,

  // Original text: 'Select a network on which to connect each VIF:'
  migrateVmsSelectNetwork: undefined,

  // Original text: 'Smart mapping'
  migrateVmsSmartMapping: undefined,

  // Original text: 'VIF'
  migrateVmVif: undefined,

  // Original text: 'Network'
  migrateVmNetwork: undefined,

  // Original text: 'No target host'
  migrateVmNoTargetHost: undefined,

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: undefined,

  // Original text: 'No default SR'
  migrateVmNoDefaultSrError: undefined,

  // Original text: 'Default SR not connected to host'
  migrateVmNotConnectedDefaultSrError: undefined,

  // Original text: 'For each VDI, select an SR:'
  chooseSrForEachVdisModalSelectSr: undefined,

  // Original text: 'Select main SR…'
  chooseSrForEachVdisModalMainSr: undefined,

  // Original text: 'VDI'
  chooseSrForEachVdisModalVdiLabel: undefined,

  // Original text: 'SR*'
  chooseSrForEachVdisModalSrLabel: undefined,

  // Original text: '* optional'
  chooseSrForEachVdisModalOptionalEntry: undefined,

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage: undefined,

  // Original text: 'Delete VDI{nVdis, plural, one {} other {s}}'
  deleteVdisModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVdis, number} disk{nVdis, plural, one {} other {s}}? ALL DATA ON THESE DISKS WILL BE LOST'
  deleteVdisModalMessage: undefined,

  // Original text: 'Delete schedule{nSchedules, plural, one {} other {s}}'
  deleteSchedulesModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nSchedules, number} schedule{nSchedules, plural, one {} other {s}}?'
  deleteSchedulesModalMessage: undefined,

  // Original text: 'Revert your VM'
  revertVmModalTitle: undefined,

  // Original text: 'Delete VIF{nVifs, plural, one {} other {s}}'
  deleteVifsModalTitle: undefined,

  // Original text: 'Are you sure you want to delete {nVifs, number} VIF{nVifs, plural, one {} other {s}}?'
  deleteVifsModalMessage: undefined,

  // Original text: 'Delete snapshot'
  deleteSnapshotModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this snapshot?'
  deleteSnapshotModalMessage: undefined,

  // Original text: 'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.'
  revertVmModalMessage: undefined,

  // Original text: 'Snapshot before'
  revertVmModalSnapshotBefore: undefined,

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Importar este Backup: {name}',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Iniciar VM após restauração',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Selecionar backup…',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: 'Você tem certeza que deseja remover todos as VDIs orfãs?',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Remover todos os logs',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: 'Você tem certeza que deseja remover todos os logs?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'Esta operação é definitiva.',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Uso anterior SR',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText: 'Este caminho foi previamente utilizado como um dispositivo de armazenamento por um host XenServer. Todos os dados serão perdidos se você optar por continuar a criação do SR.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Uso anterior LUN',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText: 'Este LUN foi previamente utilizado como um dispositivo de armazenamento por um host XenServer. Todos os dados serão perdidos se você optar por continuar a criação do SR.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Deseja substituir o registro atual?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText: 'O seu XO appliance já foi registrado com o e-mail {email}, você tem certeza que gostaria de substituir este registro?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Pronto para iniciar o teste (trial)?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText: 'Durante o período experimental, XOA precisa de uma conexão internet. Esta limitação não se aplica em nossos planos pagos!',

  // Original text: 'Label'
  serverLabel: undefined,

  // Original text: "Host"
  serverHost: 'Host',

  // Original text: "Username"
  serverUsername: 'Nome de Usuário',

  // Original text: "Password"
  serverPassword: 'Senha',

  // Original text: "Action"
  serverAction: 'Ação',

  // Original text: "Read Only"
  serverReadOnly: 'Modo Leitura',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: undefined,

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: undefined,

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo: undefined,

  // Original text: 'Disconnect server'
  serverDisconnect: undefined,

  // Original text: 'username'
  serverPlaceHolderUser: undefined,

  // Original text: 'password'
  serverPlaceHolderPassword: undefined,

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: undefined,

  // Original text: 'label'
  serverPlaceHolderLabel: undefined,

  // Original text: 'Connect'
  serverConnect: undefined,

  // Original text: 'Error'
  serverError: undefined,

  // Original text: 'Adding server failed'
  serverAddFailed: undefined,

  // Original text: 'Status'
  serverStatus: undefined,

  // Original text: 'Connection failed. Click for more information.'
  serverConnectionFailed: undefined,

  // Original text: 'Connecting…'
  serverConnecting: undefined,

  // Original text: 'Connected'
  serverConnected: undefined,

  // Original text: 'Disconnected'
  serverDisconnected: undefined,

  // Original text: 'Authentication error'
  serverAuthFailed: undefined,

  // Original text: 'Unknown error'
  serverUnknownError: undefined,

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: undefined,

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion: undefined,

  // Original text: "Copy VM"
  copyVm: 'Copiar VM',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Você tem certeza que deseja copiar esta VM para {SR}?',

  // Original text: "Name"
  copyVmName: 'Nome',

  // Original text: 'Name pattern'
  copyVmNamePattern: undefined,

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Se vazio: Nome da VM copiada',

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: undefined,

  // Original text: "Select SR"
  copyVmSelectSr: 'Selecionar SR',

  // Original text: "Use compression"
  copyVmCompress: 'Compressão',

  // Original text: 'No target SR'
  copyVmsNoTargetSr: undefined,

  // Original text: 'A target SR is required to copy a VM'
  copyVmsNoTargetSrMessage: undefined,

  // Original text: 'Detach host'
  detachHostModalTitle: undefined,

  // Original text: 'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.'
  detachHostModalMessage: undefined,

  // Original text: 'Detach'
  detachHost: undefined,

  // Original text: 'Forget host'
  forgetHostModalTitle: undefined,

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage: undefined,

  // Original text: 'Forget'
  forgetHost: undefined,

  // Original text: 'Designate a new master'
  setPoolMasterModalTitle: undefined,

  // Original text: 'This operation may take several minutes. Do you want to continue?'
  setPoolMasterModalMessage: undefined,

  // Original text: "Create network"
  newNetworkCreate: 'Criar rede',

  // Original text: 'Create bonded network'
  newBondedNetworkCreate: undefined,

  // Original text: "Interface"
  newNetworkInterface: 'Inerface',

  // Original text: "Name"
  newNetworkName: 'Nome',

  // Original text: "Description"
  newNetworkDescription: 'Descrição',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'Sem VLAN, caso esteja vazia',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'Padrão: 1500',

  // Original text: 'Name required'
  newNetworkNoNameErrorTitle: undefined,

  // Original text: 'A name is required to create a network'
  newNetworkNoNameErrorMessage: undefined,

  // Original text: 'Bond mode'
  newNetworkBondMode: undefined,

  // Original text: "Delete network"
  deleteNetwork: 'Deletar rede',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Você tem certeza que deseja deletar esta rede?',

  // Original text: 'This network is currently in use'
  networkInUse: undefined,

  // Original text: 'Bonded'
  pillBonded: undefined,

  // Original text: 'Host'
  addHostSelectHost: undefined,

  // Original text: 'No host'
  addHostNoHost: undefined,

  // Original text: 'No host selected to be added'
  addHostNoHostMessage: undefined,

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "Xen Orchestra server"
  xenOrchestraServer: 'servidor',

  // Original text: "Xen Orchestra web client"
  xenOrchestraWeb: 'cliente web',

  // Original text: "No pro support provided!"
  noProSupport: 'Nenhum suporte pro fornecido!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'O uso deste em produção é por sua conta e risco',

  // Original text: 'You can download our turnkey appliance at {website}'
  downloadXoaFromWebsite: undefined,

  // Original text: "Bug Tracker"
  bugTracker: 'Rastreador de bug',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Problemas? Envie agora!',

  // Original text: "Community"
  community: 'Comunidade',

  // Original text: "Join our community forum!"
  communityText: 'Participe do nosso forum e de nossa comunidade!',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Versão Premium Edition disponível para período de teste (Trial)',

  // Original text: "Request your trial now!"
  freeTrialNow: 'Peça já seu período de teste (Trial)',

  // Original text: "Any issue?"
  issues: 'Algum problema encontrado?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Problemas? Entre em contato conosco',

  // Original text: "Documentation"
  documentation: 'Documentação',

  // Original text: "Read our official doc"
  documentationText: 'Leia nossa documentação oficial (Em inglês)',

  // Original text: "Pro support included"
  proSupportIncluded: 'Suporte Pro incluído',

  // Original text: "Access your XO Account"
  xoAccount: 'Acesse sua conta XO',

  // Original text: "Report a problem"
  openTicket: 'Enviar um problema',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Algum problema? Abra um ticket agora!',

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Atualização necessária',

  // Original text: "Upgrade now!"
  upgradeNow: 'Atualize agora!',

  // Original text: "Or"
  or: 'Ou',

  // Original text: "Try it for free!"
  tryIt: 'Teste agora, é grátis!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'Este recurso é disponível a partir da versão {plan}',

  // Original text: 'This feature is not available in your version, contact your administrator to know more.'
  notAvailable: undefined,

  // Original text: 'Updates'
  updateTitle: undefined,

  // Original text: "Registration"
  registration: 'Inscrição',

  // Original text: "Trial"
  trial: 'Teste (Trial)',

  // Original text: "Settings"
  settings: 'Configurações',

  // Original text: 'Proxy settings'
  proxySettings: undefined,

  // Original text: 'Host (myproxy.example.org)'
  proxySettingsHostPlaceHolder: undefined,

  // Original text: 'Port (eg: 3128)'
  proxySettingsPortPlaceHolder: undefined,

  // Original text: 'Username'
  proxySettingsUsernamePlaceHolder: undefined,

  // Original text: 'Password'
  proxySettingsPasswordPlaceHolder: undefined,

  // Original text: 'Your email account'
  updateRegistrationEmailPlaceHolder: undefined,

  // Original text: 'Your password'
  updateRegistrationPasswordPlaceHolder: undefined,

  // Original text: 'Troubleshooting documentation'
  updaterTroubleshootingLink: undefined,

  // Original text: "Update"
  update: 'Atualizar (Update)',

  // Original text: 'Refresh'
  refresh: undefined,

  // Original text: "Upgrade"
  upgrade: 'Atualização (Upgrade)',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'Nenhuma atualização disponível para a versão Community Edition',

  // Original text: 'Please consider subscribing and trying it with all the features for free during 15 days on {link}.'
  considerSubscribe: undefined,

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning: 'Atualização feita de forma manual pode corromper sua instalação atual devido a problema de dependências, tenha cuidado!',

  // Original text: "Current version:"
  currentVersion: 'Versão atual:',

  // Original text: "Register"
  register: 'Registrar',

  // Original text: 'Edit registration'
  editRegistration: undefined,

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Por favor, tome seu tempo para se registrar a fim de desfrutar do seu período de teste (trial)',

  // Original text: "Start trial"
  trialStartButton: 'Iniciar teste (trial)',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil: 'Sua versao de teste é válida até {date, date, medium}. Após esta data escolha um de nossos planos e continue a desfrutar de nosso software e serviços!',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Seu período de teste chegou ao fim. Entre em contato conosco ou faça o downgrade para a versão grátis',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked: 'Seu serviço de atualização XOA parece não funcionar. Seu XOA não pode funcionar corretamente sem este serviço.',

  // Original text: 'No update information available'
  noUpdateInfo: undefined,

  // Original text: 'Update information may be available'
  waitingUpdateInfo: undefined,

  // Original text: 'Your XOA is up-to-date'
  upToDate: undefined,

  // Original text: 'You need to update your XOA (new version is available)'
  mustUpgrade: undefined,

  // Original text: 'Your XOA is not registered for updates'
  registerNeeded: undefined,

  // Original text: "Can't fetch update information"
  updaterError: undefined,

  // Original text: 'Upgrade successful'
  promptUpgradeReloadTitle: undefined,

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?'
  promptUpgradeReloadMessage: undefined,

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra versão Open-Source',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'Você está usando XO Open-Source! Isso é ótimo para um uso pessoal / sem fins lucrativos.',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: 'Se você é uma empresa, é melhor usá-lo com o nosso sistema appliance + suporte pro inclusos:',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'Esta versão não está vinculada a qualquer tipo de suporte nem atualizações. Use-a com cuidado em se tratando de tarefas críticas.',

  // Original text: "Connect PIF"
  connectPif: 'Conectar PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: 'Você tem certeza que deseja conectar este PIF?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Desconectar PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'Você tem certeza que deseja desconectar este PIF?',

  // Original text: "Delete PIF"
  deletePif: 'Deletar PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: 'Você tem certeza que deseja conectar este PIF?',

  // Original text: 'Delete PIFs'
  deletePifs: undefined,

  // Original text: 'Are you sure you want to delete {nPifs, number} PIF{nPifs, plural, one {} other {s}}?'
  deletePifsConfirm: undefined,

  // Original text: 'Connected'
  pifConnected: undefined,

  // Original text: 'Disconnected'
  pifDisconnected: undefined,

  // Original text: 'Physically connected'
  pifPhysicallyConnected: undefined,

  // Original text: 'Physically disconnected'
  pifPhysicallyDisconnected: undefined,

  // Original text: 'Username'
  username: undefined,

  // Original text: 'Password'
  password: undefined,

  // Original text: 'Language'
  language: undefined,

  // Original text: 'Old password'
  oldPasswordPlaceholder: undefined,

  // Original text: 'New password'
  newPasswordPlaceholder: undefined,

  // Original text: 'Confirm new password'
  confirmPasswordPlaceholder: undefined,

  // Original text: 'Confirmation password incorrect'
  confirmationPasswordError: undefined,

  // Original text: 'Password does not match the confirm password.'
  confirmationPasswordErrorBody: undefined,

  // Original text: 'Password changed'
  pwdChangeSuccess: undefined,

  // Original text: 'Your password has been successfully changed.'
  pwdChangeSuccessBody: undefined,

  // Original text: 'Incorrect password'
  pwdChangeError: undefined,

  // Original text: 'The old password provided is incorrect. Your password has not been changed.'
  pwdChangeErrorBody: undefined,

  // Original text: 'OK'
  changePasswordOk: undefined,

  // Original text: 'SSH keys'
  sshKeys: undefined,

  // Original text: 'New SSH key'
  newSshKey: undefined,

  // Original text: 'Delete'
  deleteSshKey: undefined,

  // Original text: 'Delete selected SSH keys'
  deleteSshKeys: undefined,

  // Original text: 'No SSH keys'
  noSshKeys: undefined,

  // Original text: 'New SSH key'
  newSshKeyModalTitle: undefined,

  // Original text: 'Invalid key'
  sshKeyErrorTitle: undefined,

  // Original text: 'An SSH key requires both a title and a key.'
  sshKeyErrorMessage: undefined,

  // Original text: 'Title'
  title: undefined,

  // Original text: 'Key'
  key: undefined,

  // Original text: 'Delete SSH key'
  deleteSshKeyConfirm: undefined,

  // Original text: 'Are you sure you want to delete the SSH key {title}?'
  deleteSshKeyConfirmMessage: undefined,

  // Original text: 'Delete SSH key{nKeys, plural, one {} other {s}}'
  deleteSshKeysConfirm: undefined,

  // Original text: 'Are you sure you want to delete {nKeys, number} SSH key{nKeys, plural, one {} other {s}}?'
  deleteSshKeysConfirmMessage: undefined,

  // Original text: 'Others'
  others: undefined,

  // Original text: 'Loading logs…'
  loadingLogs: undefined,

  // Original text: 'User'
  logUser: undefined,

  // Original text: 'Method'
  logMethod: undefined,

  // Original text: 'Params'
  logParams: undefined,

  // Original text: 'Message'
  logMessage: undefined,

  // Original text: 'Error'
  logError: undefined,

  // Original text: 'Display details'
  logDisplayDetails: undefined,

  // Original text: 'Date'
  logTime: undefined,

  // Original text: 'No stack trace'
  logNoStackTrace: undefined,

  // Original text: 'No params'
  logNoParams: undefined,

  // Original text: 'Delete log'
  logDelete: undefined,

  // Original text: 'Delete logs'
  logsDelete: undefined,

  // Original text: 'Delete log{nLogs, plural, one {} other {s}}'
  logDeleteMultiple: undefined,

  // Original text: 'Are you sure you want to delete {nLogs, number} log{nLogs, plural, one {} other {s}}?'
  logDeleteMultipleMessage: undefined,

  // Original text: 'Delete all logs'
  logDeleteAll: undefined,

  // Original text: 'Delete all logs'
  logDeleteAllTitle: undefined,

  // Original text: 'Are you sure you want to delete all the logs?'
  logDeleteAllMessage: undefined,

  // Original text: 'Click to enable'
  logIndicationToEnable: undefined,

  // Original text: 'Click to disable'
  logIndicationToDisable: undefined,

  // Original text: 'Report a bug'
  reportBug: undefined,

  // Original text: 'Job canceled to protect the VDI chain'
  unhealthyVdiChainError: undefined,

  // Original text: 'Click for more information'
  clickForMoreInformation: undefined,

  // Original text: 'Name'
  ipPoolName: undefined,

  // Original text: 'IPs'
  ipPoolIps: undefined,

  // Original text: 'IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)'
  ipPoolIpsPlaceholder: undefined,

  // Original text: 'Networks'
  ipPoolNetworks: undefined,

  // Original text: 'No IP pools'
  ipsNoIpPool: undefined,

  // Original text: 'Create'
  ipsCreate: undefined,

  // Original text: 'Delete all IP pools'
  ipsDeleteAllTitle: undefined,

  // Original text: 'Are you sure you want to delete all the IP pools?'
  ipsDeleteAllMessage: undefined,

  // Original text: 'VIFs'
  ipsVifs: undefined,

  // Original text: 'Not used'
  ipsNotUsed: undefined,

  // Original text: 'unknown VIF'
  ipPoolUnknownVif: undefined,

  // Original text: 'Name already exists'
  ipPoolNameAlreadyExists: undefined,

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: undefined,

  // Original text: 'Global'
  shortcut_XoApp: undefined,

  // Original text: 'Go to hosts list'
  shortcut_XoApp_GO_TO_HOSTS: undefined,

  // Original text: 'Go to pools list'
  shortcut_XoApp_GO_TO_POOLS: undefined,

  // Original text: 'Go to VMs list'
  shortcut_XoApp_GO_TO_VMS: undefined,

  // Original text: 'Go to SRs list'
  shortcut_XoApp_GO_TO_SRS: undefined,

  // Original text: 'Create a new VM'
  shortcut_XoApp_CREATE_VM: undefined,

  // Original text: 'Unfocus field'
  shortcut_XoApp_UNFOCUS: undefined,

  // Original text: 'Show shortcuts key bindings'
  shortcut_XoApp_HELP: undefined,

  // Original text: 'Home'
  shortcut_Home: undefined,

  // Original text: 'Focus search bar'
  shortcut_Home_SEARCH: undefined,

  // Original text: 'Next item'
  shortcut_Home_NAV_DOWN: undefined,

  // Original text: 'Previous item'
  shortcut_Home_NAV_UP: undefined,

  // Original text: 'Select item'
  shortcut_Home_SELECT: undefined,

  // Original text: 'Open'
  shortcut_Home_JUMP_INTO: undefined,

  // Original text: 'Supported tables'
  shortcut_SortedTable: undefined,

  // Original text: 'Focus the table search bar'
  shortcut_SortedTable_SEARCH: undefined,

  // Original text: 'Next item'
  shortcut_SortedTable_NAV_DOWN: undefined,

  // Original text: 'Previous item'
  shortcut_SortedTable_NAV_UP: undefined,

  // Original text: 'Select item'
  shortcut_SortedTable_SELECT: undefined,

  // Original text: 'Action'
  shortcut_SortedTable_ROW_ACTION: undefined,

  // Original text: 'VM'
  settingsAclsButtonTooltipVM: undefined,

  // Original text: 'Hosts'
  settingsAclsButtonTooltiphost: undefined,

  // Original text: 'Pool'
  settingsAclsButtonTooltippool: undefined,

  // Original text: 'SR'
  settingsAclsButtonTooltipSR: undefined,

  // Original text: 'Network'
  settingsAclsButtonTooltipnetwork: undefined,

  // Original text: 'No config file selected'
  noConfigFile: undefined,

  // Original text: 'Try dropping a config file here, or click to select a config file to upload.'
  importTip: undefined,

  // Original text: 'Config'
  config: undefined,

  // Original text: 'Import'
  importConfig: undefined,

  // Original text: 'Config file successfully imported'
  importConfigSuccess: undefined,

  // Original text: 'Error while importing config file'
  importConfigError: undefined,

  // Original text: 'Export'
  exportConfig: undefined,

  // Original text: 'Download current config'
  downloadConfig: undefined,

  // Original text: 'No config import available for Community Edition'
  noConfigImportCommunity: undefined,

  // Original text: 'Reconnect all hosts'
  srReconnectAllModalTitle: undefined,

  // Original text: 'This will reconnect this SR to all its hosts.'
  srReconnectAllModalMessage: undefined,

  // Original text: 'This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR).'
  srsReconnectAllModalMessage: undefined,

  // Original text: 'Disconnect all hosts'
  srDisconnectAllModalTitle: undefined,

  // Original text: 'This will disconnect this SR from all its hosts.'
  srDisconnectAllModalMessage: undefined,

  // Original text: 'This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR).'
  srsDisconnectAllModalMessage: undefined,

  // Original text: 'Forget SR'
  srForgetModalTitle: undefined,

  // Original text: 'Forget selected SRs'
  srsForgetModalTitle: undefined,

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: undefined,

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage: undefined,

  // Original text: 'Disconnected'
  srAllDisconnected: undefined,

  // Original text: 'Partially connected'
  srSomeConnected: undefined,

  // Original text: 'Connected'
  srAllConnected: undefined,

  // Original text: 'XOSAN'
  xosanTitle: undefined,

  // Original text: 'Xen Orchestra SAN SR'
  xosanSrTitle: undefined,

  // Original text: 'Select local SRs (lvm)'
  xosanAvailableSrsTitle: undefined,

  // Original text: 'Suggestions'
  xosanSuggestions: undefined,

  // Original text: 'Warning: using disperse layout is not recommended right now. Please read {link}.'
  xosanDisperseWarning: undefined,

  // Original text: 'Name'
  xosanName: undefined,

  // Original text: 'Host'
  xosanHost: undefined,

  // Original text: 'Connected Hosts'
  xosanHosts: undefined,

  // Original text: 'Pool'
  xosanPool: undefined,

  // Original text: 'Volume ID'
  xosanVolumeId: undefined,

  // Original text: 'Size'
  xosanSize: undefined,

  // Original text: 'Used space'
  xosanUsedSpace: undefined,

  // Original text: 'License'
  xosanLicense: undefined,

  // Original text: 'This XOSAN has more than 1 license!'
  xosanMultipleLicenses: undefined,

  // Original text: 'XOSAN pack needs to be installed on each host of the pool.'
  xosanNeedPack: undefined,

  // Original text: 'Install it now!'
  xosanInstallIt: undefined,

  // Original text: 'Some hosts need their toolstack to be restarted before you can create an XOSAN'
  xosanNeedRestart: undefined,

  // Original text: 'Restart toolstacks'
  xosanRestartAgents: undefined,

  // Original text: 'Pool master is not running'
  xosanMasterOffline: undefined,

  // Original text: 'Install XOSAN pack on {pool}'
  xosanInstallPackTitle: undefined,

  // Original text: 'Select at least 2 SRs'
  xosanSelect2Srs: undefined,

  // Original text: 'Layout'
  xosanLayout: undefined,

  // Original text: 'Redundancy'
  xosanRedundancy: undefined,

  // Original text: 'Capacity'
  xosanCapacity: undefined,

  // Original text: 'Available space'
  xosanAvailableSpace: undefined,

  // Original text: '* Can fail without data loss'
  xosanDiskLossLegend: undefined,

  // Original text: 'Create'
  xosanCreate: undefined,

  // Original text: 'Add'
  xosanAdd: undefined,

  // Original text: 'Installing XOSAN. Please wait…'
  xosanInstalling: undefined,

  // Original text: 'No XOSAN available for Community Edition'
  xosanCommunity: undefined,

  // Original text: 'New'
  xosanNew: undefined,

  // Original text: 'Advanced'
  xosanAdvanced: undefined,

  // Original text: 'Remove subvolumes'
  xosanRemoveSubvolumes: undefined,

  // Original text: 'Add subvolume…'
  xosanAddSubvolume: undefined,

  // Original text: "This version of XOSAN SR is from the first beta phase. You can keep using it, but to modify it you'll have to save your disks and re-create it."
  xosanWarning: undefined,

  // Original text: 'VLAN'
  xosanVlan: undefined,

  // Original text: 'No XOSAN found'
  xosanNoSrs: undefined,

  // Original text: 'Some SRs are detached from the XOSAN'
  xosanPbdsDetached: undefined,

  // Original text: 'Something is wrong with: {badStatuses}'
  xosanBadStatus: undefined,

  // Original text: 'Running'
  xosanRunning: undefined,

  // Original text: 'Delete XOSAN'
  xosanDelete: undefined,

  // Original text: 'Fix'
  xosanFixIssue: undefined,

  // Original text: 'Creating XOSAN on {pool}'
  xosanCreatingOn: undefined,

  // Original text: 'Configuring network…'
  xosanState_configuringNetwork: undefined,

  // Original text: 'Importing VM…'
  xosanState_importingVm: undefined,

  // Original text: 'Copying VMs…'
  xosanState_copyingVms: undefined,

  // Original text: 'Configuring VMs…'
  xosanState_configuringVms: undefined,

  // Original text: 'Configuring gluster…'
  xosanState_configuringGluster: undefined,

  // Original text: 'Creating SR…'
  xosanState_creatingSr: undefined,

  // Original text: 'Scanning SR…'
  xosanState_scanningSr: undefined,

  // Original text: 'Install cloud plugin first'
  xosanInstallCloudPlugin: undefined,

  // Original text: 'Load cloud plugin first'
  xosanLoadCloudPlugin: undefined,

  // Original text: 'Register your appliance first'
  xosanRegister: undefined,

  // Original text: 'Loading…'
  xosanLoading: undefined,

  // Original text: 'XOSAN is not available at the moment'
  xosanNotAvailable: undefined,

  // Original text: 'Install XOSAN pack on these hosts:'
  xosanInstallPackOnHosts: undefined,

  // Original text: 'Install {pack} v{version}?'
  xosanInstallPack: undefined,

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: undefined,

  // Original text: 'At least one of these version requirements must be satisfied by all the hosts in this pool:'
  xosanPackRequirements: undefined,

  // Original text: 'Some XOSAN Virtual Machines are not running'
  xosanVmsNotRunning: undefined,

  // Original text: 'Some XOSAN Virtual Machines could not be found'
  xosanVmsNotFound: undefined,

  // Original text: 'Files needing healing'
  xosanFilesNeedingHealing: undefined,

  // Original text: 'Some XOSAN Virtual Machines have files needing healing'
  xosanFilesNeedHealing: undefined,

  // Original text: 'Host {hostName} is not in XOSAN network'
  xosanHostNotInNetwork: undefined,

  // Original text: 'VM controller'
  xosanVm: undefined,

  // Original text: 'SR'
  xosanUnderlyingStorage: undefined,

  // Original text: 'Replace…'
  xosanReplace: undefined,

  // Original text: 'On same VM'
  xosanOnSameVm: undefined,

  // Original text: 'Brick name'
  xosanBrickName: undefined,

  // Original text: 'Brick UUID'
  xosanBrickUuid: undefined,

  // Original text: 'Brick size'
  xosanBrickSize: undefined,

  // Original text: 'Memory size'
  xosanMemorySize: undefined,

  // Original text: 'Status'
  xosanStatus: undefined,

  // Original text: 'Arbiter'
  xosanArbiter: undefined,

  // Original text: 'Used Inodes'
  xosanUsedInodes: undefined,

  // Original text: 'Block size'
  xosanBlockSize: undefined,

  // Original text: 'Device'
  xosanDevice: undefined,

  // Original text: 'FS name'
  xosanFsName: undefined,

  // Original text: 'Mount options'
  xosanMountOptions: undefined,

  // Original text: 'Path'
  xosanPath: undefined,

  // Original text: 'Job'
  xosanJob: undefined,

  // Original text: 'PID'
  xosanPid: undefined,

  // Original text: 'Port'
  xosanPort: undefined,

  // Original text: 'Missing values'
  xosanReplaceBrickErrorTitle: undefined,

  // Original text: 'You need to select a SR and a size'
  xosanReplaceBrickErrorMessage: undefined,

  // Original text: 'Bad values'
  xosanAddSubvolumeErrorTitle: undefined,

  // Original text: 'You need to select {nSrs, number} and a size'
  xosanAddSubvolumeErrorMessage: undefined,

  // Original text: 'Select {nSrs, number} SRs'
  xosanSelectNSrs: undefined,

  // Original text: 'Run'
  xosanRun: undefined,

  // Original text: 'Remove'
  xosanRemove: undefined,

  // Original text: 'Volume'
  xosanVolume: undefined,

  // Original text: 'Volume options'
  xosanVolumeOptions: undefined,

  // Original text: 'Could not find VM'
  xosanCouldNotFindVm: undefined,

  // Original text: 'Using {usage}'
  xosanUnderlyingStorageUsage: undefined,

  // Original text: 'Custom IP network (/24)'
  xosanCustomIpNetwork: undefined,

  // Original text: 'Will configure the host xosan network device with a static IP address and plug it in.'
  xosanIssueHostNotInNetwork: undefined,

  // Original text: 'Licenses'
  licensesTitle: undefined,

  // Original text: 'You are not registered and therefore will not be able to create or manage your XOSAN SRs. {link}'
  xosanUnregisteredDisclaimer: undefined,

  // Original text: 'In order to create a XOSAN SR, you need to use the Xen Orchestra Appliance and buy a XOSAN license on {link}.'
  xosanSourcesDisclaimer: undefined,

  // Original text: 'Register now!'
  registerNow: undefined,

  // Original text: 'You need to register your appliance to manage your licenses.'
  licensesUnregisteredDisclaimer: undefined,

  // Original text: 'Product'
  licenseProduct: undefined,

  // Original text: 'Attached to'
  licenseBoundObject: undefined,

  // Original text: 'Purchaser'
  licensePurchaser: undefined,

  // Original text: 'Expires'
  licenseExpires: undefined,

  // Original text: 'You'
  licensePurchaserYou: undefined,

  // Original text: 'Support'
  productSupport: undefined,

  // Original text: 'No XOSAN attached'
  licenseNotBoundXosan: undefined,

  // Original text: 'License attached to an unknown XOSAN'
  licenseBoundUnknownXosan: undefined,

  // Original text: 'Manage the licenses'
  licensesManage: undefined,

  // Original text: 'New license'
  newLicense: undefined,

  // Original text: 'Refresh'
  refreshLicenses: undefined,

  // Original text: 'Limited size because XOSAN is in trial'
  xosanLicenseRestricted: undefined,

  // Original text: 'You need a license on this SR to manage the XOSAN.'
  xosanAdminNoLicenseDisclaimer: undefined,

  // Original text: 'Your XOSAN license has expired. You can still use the SR but cannot administrate it anymore.'
  xosanAdminExpiredLicenseDisclaimer: undefined,

  // Original text: 'Could not check the license on this XOSAN SR'
  xosanCheckLicenseError: undefined,

  // Original text: 'Could not fetch licenses'
  xosanGetLicensesError: undefined,

  // Original text: 'License has expired.'
  xosanLicenseHasExpired: undefined,

  // Original text: 'License expires on {date}.'
  xosanLicenseExpiresDate: undefined,

  // Original text: 'Update the license now!'
  xosanUpdateLicenseMessage: undefined,

  // Original text: 'Unknown XOSAN SR.'
  xosanUnknownSr: undefined,

  // Original text: 'Contact us!'
  contactUs: undefined,

  // Original text: 'No license.'
  xosanNoLicense: undefined,

  // Original text: 'Unlock now!'
  xosanUnlockNow: undefined,

  // Original text: 'XOSAN Beta is over. You may now delete and recreate previous existing XOSAN SRs.'
  xosanBetaOverMessage: undefined,

  // Original text: 'Select a license'
  selectLicense: undefined,

  // Original text: 'Bind license'
  bindLicense: undefined,

  // Original text: 'expires on {date}'
  expiresOn: undefined,

  // Original text: 'Install XOA plugin first'
  xosanInstallXoaPlugin: undefined,

  // Original text: 'Load XOA plugin first'
  xosanLoadXoaPlugin: undefined,

  // Original text: '{days, plural, =0 {} one {# day } other {# days }}{hours, plural, =0 {} one {# hour } other {# hours }}{minutes, plural, =0 {} one {# minute } other {# minutes }}{seconds, plural, =0 {} one {# second} other {# seconds}}'
  durationFormat: undefined,
}
