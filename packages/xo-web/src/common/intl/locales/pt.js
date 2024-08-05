// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/pt'

import reactIntlData from 'react-intl/locale-data/pt'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
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

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'Confirmar',

  // Original text: "Cancel"
  confirmCancel: 'Cancelar',

  // Original text: 'On error'
  onError: undefined,

  // Original text: 'Successful'
  successful: undefined,

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

  // Original text: "Updates"
  updatePage: 'Atualizações',

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

  // Original text: "About"
  aboutPage: 'Sobre',

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

  // Original text: "Overview"
  backupOverviewPage: 'Visão Geral',

  // Original text: "New"
  backupNewPage: 'Novo(a)',

  // Original text: "Remotes"
  backupRemotesPage: 'Armazenamento a distância',

  // Original text: "Restore"
  backupRestorePage: 'Recuperar',

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

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: 'Bem-vindo ao Xen Orchestra',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'Adicione seu XenServer hosts e pools',

  // Original text: "Want some help?"
  homeHelp: 'Posso te ajudar?',

  // Original text: "Add server"
  homeAddServer: 'Adicionar Servidor',

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

  // Original text: "New VM"
  homeNewVm: 'Criar nova VM',

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

  // Original text: "Name"
  homeSortByName: 'Nome',

  // Original text: "Power state"
  homeSortByPowerstate: 'Estado de energia',

  // Original text: "RAM"
  homeSortByRAM: 'RAM',

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: 'CPUs'
  homeSortByCpus: undefined,

  // Original text: '{displayed, number}x {icon} (on {total, number})'
  homeDisplayedItems: undefined,

  // Original text: '{selected, number}x {icon} selected (on {total, number})'
  homeSelectedItems: undefined,

  // Original text: "More"
  homeMore: 'Mais',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migrar para…',

  // Original text: 'Missing patches'
  homeMissingPatches: undefined,

  // Original text: 'Master:'
  homePoolMaster: undefined,

  // Original text: 'High Availability'
  highAvailability: undefined,

  // Original text: "Add"
  add: 'Adicionar',

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

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Preencha as informações necessárias.',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Preencha as informações (opcional)',

  // Original text: "Reset"
  selectTableReset: 'Reiniciar',

  // Original text: "Month"
  schedulingMonth: 'Agendamento Mensal',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Agendamento escolhido por mês',

  // Original text: "Day of the month"
  schedulingMonthDay: 'Dia do mês',

  // Original text: "Each selected day"
  schedulingEachSelectedMonthDay: 'Agendamento por dia selecionado',

  // Original text: "Day of the week"
  schedulingWeekDay: 'Dia da semana',

  // Original text: "Each selected day"
  schedulingEachSelectedWeekDay: 'Cada dia selecionado',

  // Original text: "Hour"
  schedulingHour: 'Hora',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Todas N horas',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Cada hora selecionada',

  // Original text: "Minute"
  schedulingMinute: 'Minuto',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Todos N minutos',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Cada minuto selecionado',

  // Original text: "Reset"
  schedulingReset: 'Reiniciar',

  // Original text: "Unknown"
  unknownSchedule: 'Desconhecido',

  // Original text: 'Xo-server timezone:'
  timezonePickerServerValue: undefined,

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: undefined,

  // Original text: 'Xo-server timezone'
  timezonePickerUseServerTime: undefined,

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: undefined,

  // Original text: 'Cron Pattern:'
  cronPattern: undefined,

  // Original text: 'Cannot edit backup'
  backupEditNotFoundTitle: undefined,

  // Original text: 'Missing required info for edition'
  backupEditNotFoundMessage: undefined,

  // Original text: "Job"
  job: 'Tarefa',

  // Original text: "Job ID"
  jobId: 'ID tarefa',

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

  // Original text: 'Timezone'
  jobTimezone: undefined,

  // Original text: 'xo-server'
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
  scheduleEditMessage:
    'Você esta editando o Agendamento {name} ({id}). Este procedimento irá substituir o agendamento atual.',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'Você esta editando a Tarefa {name} ({id}). Este procedimento irá substituir a tarefa atual.',

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Sem agendamentos',

  // Original text: "No jobs found."
  noJobs: 'Tarefas não encontradas',

  // Original text: "No schedules found"
  noSchedules: 'Nenhum agendamento foi encontrado',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Selecione um comando para xo-server API',

  // Original text: 'Schedules'
  jobSchedules: undefined,

  // Original text: 'Name of your schedule'
  jobScheduleNamePlaceHolder: undefined,

  // Original text: 'Select a Job'
  jobScheduleJobPlaceHolder: undefined,

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

  // Original text: 'VMs'
  editBackupVmsTitle: undefined,

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: undefined,

  // Original text: 'Resident on'
  editBackupSmartResidentOn: undefined,

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: undefined,

  // Original text: 'Tag'
  editBackupTagTitle: undefined,

  // Original text: 'Report'
  editBackupReportTitle: undefined,

  // Original text: 'Enable immediately after creation'
  editBackupScheduleEnabled: undefined,

  // Original text: 'Depth'
  editBackupDepthTitle: undefined,

  // Original text: 'Remote'
  editBackupRemoteTitle: undefined,

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

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: undefined,

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

  // Original text: '/path/to/backup'
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

  // Original text: "{users} user{users, plural, one {} other {s}}"
  countUsers: '{users} user{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Selecionar Permissão',

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

  // Original text: "Rescan all disks"
  srRescan: 'Examinar novamente todos os discos',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Conectar-se a todos os hosts',

  // Original text: "Disconnect to all hosts"
  srDisconnectAll: 'Desconectar-se de todos os hosts',

  // Original text: "Forget this SR"
  srForget: 'Esquecer esta SR',

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

  // Original text: "Hosts"
  hostsTabName: 'Hosts',

  // Original text: "High Availability"
  poolHaStatus: 'Alta Disponibilidade',

  // Original text: "Enabled"
  poolHaEnabled: 'Habilitado',

  // Original text: "Disabled"
  poolHaDisabled: 'Desativado',

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

  // Original text: "Add SR"
  addSrLabel: 'Adicionar SR',

  // Original text: "Add VM"
  addVmLabel: 'Adicionar VM',

  // Original text: "Add Host"
  addHostLabel: 'Adicionar Host',

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

  // Original text: "Core (socket)"
  hostCpusNumber: 'Núcleo (soquete)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Informações do Fabricante',

  // Original text: "BIOS info"
  hostBiosinfo: 'Informações BIOS',

  // Original text: "Licence"
  licenseHostSettingsLabel: 'Licença',

  // Original text: "Type"
  hostLicenseType: 'Tipo',

  // Original text: "Socket"
  hostLicenseSocket: 'Soquete',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Expiração',

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

  // Original text: 'Default locking mode'
  defaultLockingMode: undefined,

  // Original text: 'Configure IP address'
  pifConfigureIp: undefined,

  // Original text: 'Invalid parameters'
  configIpErrorTitle: undefined,

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

  // Original text: "No patch detected"
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

  // Original text: "non-US keyboard could have issues with console: switch your own layout to US."
  tipConsoleLabel:
    'Teclados fora do padrão US-Keyboard podem apresentar problemas com o console: Altere seu teclado e verifique!',

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
  vdiAttachDevice: 'Anexar disco',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Novo disco',

  // Original text: "Boot order"
  vdiBootOrder: 'Ordem de boot',

  // Original text: "Name"
  vdiNameLabel: 'Nome',

  // Original text: "Description"
  vdiNameDescription: 'Descrição',

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

  // Original text: 'No SR'
  vdiMigrateNoSr: undefined,

  // Original text: 'A target SR is required to migrate a VDI'
  vdiMigrateNoSrMessage: undefined,

  // Original text: 'Forget'
  vdiForget: undefined,

  // Original text: 'Remove VDI'
  vdiRemove: undefined,

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

  // Original text: 'Create'
  vbdCreate: undefined,

  // Original text: 'Disk name'
  vbdNamePlaceHolder: undefined,

  // Original text: 'Size'
  vbdSizePlaceHolder: undefined,

  // Original text: 'Save'
  saveBootOption: undefined,

  // Original text: 'Reset'
  resetBootOption: undefined,

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

  // Original text: "Action"
  snapshotAction: 'Ação',

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

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Limites de memória (min/max)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'máximo',

  // Original text: "Memory max:"
  vmMaxRam: 'Limite máximo de memória',

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

  // Original text: "RAM Usage"
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

  // Original text: '{running} running ({halted} halted)'
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

  // Original text: 'Create a new VM on {select1} or {select2}'
  newVmCreateNewVmOn2: undefined,

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

  // Original text: "Bootable"
  newVmBootableLabel: 'Inicializável',

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

  // Original text: "Are you sure you want to create {nbVms} VMs?"
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

  // Original text: 'Advanced'
  newVmAdvancedPanel: undefined,

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: undefined,

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: undefined,

  // Original text: "Resource sets"
  resourceSets: 'Ajustes de recursos',

  // Original text: 'No resource sets.'
  noResourceSets: undefined,

  // Original text: 'Loading resource sets'
  loadingResourceSets: undefined,

  // Original text: "Resource set name"
  resourceSetName: 'Ajuste de nome do recurso',

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

  // Original text: "Maximum RAM (GiB)"
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
  importVmsList:
    'Tente soltar alguns backups aqui, ou clique para selecionar os backups para que seja feito o upload. Apenas arquivos .xva são aceitos.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Nenhuma VM selecionada',

  // Original text: "To Pool:"
  vmImportToPool: 'Enviar para Pool:',

  // Original text: "To SR:"
  vmImportToSr: 'Enviar para SR:',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: 'Importar VM{nVms, plural, one {} other {s}} ',

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

  // Original text: 'Number of CPUs'
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

  // Original text: 'Display backups'
  displayBackup: undefined,

  // Original text: 'Import VM'
  importBackupTitle: undefined,

  // Original text: 'Starting your backup import'
  importBackupMessage: undefined,

  // Original text: 'VMs to backup'
  vmsToBackup: undefined,

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to shutdown {nHosts} Host{nHosts, plural, one {} other {s}}?'
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

  // Original text: 'Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: undefined,

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Iniciar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Você tem certeza que deseja iniciar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {nHosts} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: undefined,

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Parar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Você tem certeza que deseja parar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Restart VM"
  restartVmModalTitle: 'Reiniciar VM',

  // Original text: "Are you sure you want to restart {name}?"
  restartVmModalMessage: 'Você tem certeza que deseja reiniciar {name}?',

  // Original text: "Stop VM"
  stopVmModalTitle: 'Parar VM',

  // Original text: "Are you sure you want to stop {name}?"
  stopVmModalMessage: 'Você tem certeza que deseja parar {name}?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Reiniciar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Você tem certeza que deseja reiniciar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage:
    'Você tem certeza que deseja executar snapshop para {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Deletar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Você tem certeza que deseja deletar {vms} VM{vms, plural, one {} other {s}}? Todos os discos de VM serão removidos',

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

  // Original text: 'For each VDI, select an SR:'
  migrateVmSelectSrs: undefined,

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

  // Original text: 'Name'
  migrateVmName: undefined,

  // Original text: 'SR'
  migrateVmSr: undefined,

  // Original text: 'VIF'
  migrateVmVif: undefined,

  // Original text: 'Network'
  migrateVmNetwork: undefined,

  // Original text: 'No target host'
  migrateVmNoTargetHost: undefined,

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: undefined,

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: undefined,

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage: undefined,

  // Original text: 'Revert your VM'
  revertVmModalTitle: undefined,

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
  existingSrModalText:
    'Este caminho foi previamente utilizado como um dispositivo de armazenamento por um host XenServer. Todos os dados serão perdidos se você optar por continuar a criação do SR.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Uso anterior LUN',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'Este LUN foi previamente utilizado como um dispositivo de armazenamento por um host XenServer. Todos os dados serão perdidos se você optar por continuar a criação do SR.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Deseja substituir o registro atual?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText:
    'O seu XO appliance já foi registrado com o e-mail {email}, você tem certeza que gostaria de substituir este registro?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Pronto para iniciar o teste (trial)?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'Durante o período experimental, XOA precisa de uma conexão internet. Esta limitação não se aplica em nossos planos pagos!',

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

  // Original text: 'username'
  serverPlaceHolderUser: undefined,

  // Original text: 'password'
  serverPlaceHolderPassword: undefined,

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: undefined,

  // Original text: 'Connect'
  serverConnect: undefined,

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

  // Original text: "No pro support provided!"
  noProSupport: 'Nenhum suporte pro fornecido!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'O uso deste em produção é por sua conta e risco',

  // Original text: "You can download our turnkey appliance at"
  downloadXoa: 'Você pode baixar nosso turnkey appliance em',

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

  // Original text: "Acces your XO Account"
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

  // Original text: "Update"
  update: 'Atualizar (Update)',

  // Original text: 'Refresh'
  refresh: undefined,

  // Original text: "Upgrade"
  upgrade: 'Atualização (Upgrade)',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'Nenhuma atualização disponível para a versão Community Edition',

  // Original text: "Please consider subscribe and try it with all features for free during 30 days on"
  noUpdaterSubscribe: 'Oi, inscreva-se e venha testar todos nossos recursos e serviços gratuitamente por 30 dias!',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'Atualização feita de forma manual pode corromper sua instalação atual devido a problema de dependências, tenha cuidado!',

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
  trialAvailableUntil:
    'Sua versao de teste é válida até {date, date, medium}. Após esta data escolha um de nossos planos e continue a desfrutar de nosso software e serviços!',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed:
    'Seu período de teste chegou ao fim. Entre em contato conosco ou faça o downgrade para a versão grátis',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked:
    'Seu serviço de atualização XOA parece não funcionar. Seu XOA não pode funcionar corretamente sem este serviço.',

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
  disclaimerText3: 'Esta versão não está vinculada a qualquer tipo de suporte nem atualizações. Use-a com cuidado.',

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

  // Original text: 'Delete all logs'
  logDeleteAll: undefined,

  // Original text: 'Delete all logs'
  logDeleteAllTitle: undefined,

  // Original text: 'Are you sure you want to delete all the logs?'
  logDeleteAllMessage: undefined,

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

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: undefined,

  // Original text: 'Global'
  shortcut_XoApp: undefined,

  // Original text: 'Go to hosts list'
  shortcut_GO_TO_HOSTS: undefined,

  // Original text: 'Go to pools list'
  shortcut_GO_TO_POOLS: undefined,

  // Original text: 'Go to VMs list'
  shortcut_GO_TO_VMS: undefined,

  // Original text: 'Create a new VM'
  shortcut_CREATE_VM: undefined,

  // Original text: 'Unfocus field'
  shortcut_UNFOCUS: undefined,

  // Original text: 'Show shortcuts key bindings'
  shortcut_HELP: undefined,

  // Original text: 'Home'
  shortcut_Home: undefined,

  // Original text: 'Focus search bar'
  shortcut_SEARCH: undefined,

  // Original text: 'Next item'
  shortcut_NAV_DOWN: undefined,

  // Original text: 'Previous item'
  shortcut_NAV_UP: undefined,

  // Original text: 'Select item'
  shortcut_SELECT: undefined,

  // Original text: 'Open'
  shortcut_JUMP_INTO: undefined,

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
}
