// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/pt'

import reactIntlData from 'react-intl/locale-data/pt'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: "OK"
  confirmOk: 'Confirmar',

  // Original text: "Cancel"
  confirmCancel: 'Cancelar',

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Longo clique para editar',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Clique para editar',

  // Original text: "Home"
  homePage: 'Principal',

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

  // Original text: "Dashboard"
  selfServiceDashboardPage: 'Painel de Controle',

  // Original text: "Administration"
  selfServiceAdminPage: 'Administração',

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

  // Original text: "About"
  aboutPage: 'Sobre',

  // Original text: "New"
  newMenu: 'Novo(a)',

  // Original text: "Tasks"
  taskMenu: 'Atividades',

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

  // Original text: "Username:"
  usernameLabel: 'Usuário',

  // Original text: "Password:"
  passwordLabel: 'Senha',

  // Original text: "Sign in"
  signInButton: 'Entrar',

  // Original text: "Sign out"
  signOut: 'Sair',

  // Original text: "Fetching data…"
  homeFetchingData: 'Obtendo dados...',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: 'Bem-vindo ao Xen Orchestra',

  // Original text: "Add your XenServer hosts or pools"
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
  homeNoVmsOr: 'Ou...',

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

  // Original text: "Pool"
  homeTypePool: 'Pool',

  // Original text: "Host"
  homeTypeHost: 'Host',

  // Original text: "VM"
  homeTypeVm: 'VM',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: "VDI"
  homeTypeVdi: 'VDI',

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
  homeFilterRunningVms: 'Vms Ativas',

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

  // Original text: "{displayed, number}x {vmIcon} (on {total, number})"
  homeDisplayedVms: '{displayed, number}x {vmIcon} (sobre {total, number})',

  // Original text: "{selected, number}x {vmIcon} selected (on {total, number})"
  homeSelectedVms: '{selected, number}x {vmIcon} selected (sobre {total, number})',

  // Original text: "More"
  homeMore: 'Mais',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Migrar para...',

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
  selectObjects: 'Selecionar Objeto(s)...',

  // Original text: "Choose a role"
  selectRole: 'Escolha uma função',

  // Original text: "Select Host(s)…"
  selectHosts: 'Selecionar Host(s)...',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Selecionar Objeto(s)...',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Selecionar Rede(s)...',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Selecionar PIF(s)...',

  // Original text: "Select Pool(s)…"
  selectPools: 'Selecionar Pool(s)...',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Selecionar Remote(s)...',

  // Original text: "Select SR(s)…"
  selectSrs: 'Selecionar SR(s)...',

  // Original text: "Select VM(s)…"
  selectVms: 'Selecionar VM(s)...',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Selecionar VM(s) modelo(s)...',

  // Original text: "Select tag(s)…"
  selectTags: 'Selecionar etiqueta(s)...',

  // Original text: "Select disk(s)…"
  selectVdis: 'Selecionar disco(s)...',

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Preencha as informações necessárias.',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Preencha as informações (opcional)',

  // Original text: "Reset"
  selectTableReset: 'Reiniciar',

  // Original text: "Month"
  schedulingMonth: 'Agendamento Mensal',

  // Original text: "Every month"
  schedulingEveryMonth: 'Agentamento fixo mensal',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Agendamento escolhido por mês',

  // Original text: "Day of the month"
  schedulingMonthDay: 'Dia do mês',

  // Original text: "Every day"
  schedulingEveryMonthDay: 'Agendamento diário',

  // Original text: "Each selected day"
  schedulingEachSelectedMonthDay: 'Agendamento por dia selecionado',

  // Original text: "Day of the week"
  schedulingWeekDay: 'Dia da semana',

  // Original text: "Every day"
  schedulingEveryWeekDay: 'Todo dia',

  // Original text: "Each selected day"
  schedulingEachSelectedWeekDay: 'Cada dia selecionado',

  // Original text: "Hour"
  schedulingHour: 'Hora',

  // Original text: "Every hour"
  schedulingEveryHour: 'Todas as horas',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Todas N horas',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Cada hora selecionada',

  // Original text: "Minute"
  schedulingMinute: 'Minuto',

  // Original text: "Every minute"
  schedulingEveryMinute: 'Todo minuto',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Todos N minutos',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Cada minuto selecionado',

  // Original text: "Reset"
  schedulingReset: 'Reiniciar',

  // Original text: "Unknown"
  unknownSchedule: 'Desconhecido',

  // Original text: "Job"
  job: 'tarefa',

  // Original text: "Job ID"
  jobId: 'ID tarefa',

  // Original text: "Name"
  jobName: 'Nome',

  // Original text: "Start"
  jobStart: 'Iniciar',

  // Original text: "End"
  jobEnd: 'Terminar',

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

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Sem agendamentos',

  // Original text: "No jobs found."
  noJobs: 'Tarefas não encontradas',

  // Original text: "No schedules found"
  noSchedules: 'Nenhum agendamento foi encontrado',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Selecione um comando para xo-server API',

  // Original text: "Select your backup type:"
  newBackupSelection: 'Selecione seu tipo de backup',

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

  // Original text: "General"
  newSrGeneral: 'Geral',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Selecionar o tipo de armazenamento (storage)',

  // Original text: "Settings"
  newSrSettings: 'Configuraçõesé',

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

  // Original text: "Users/Groups"
  subjectName: 'Usuários/Grupos',

  // Original text: "Object"
  objectName: 'Objeto',

  // Original text: "Role"
  roleName: 'Função',

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

  // Original text: "Delete User"
  deleteUSer: 'Deletar Usuário',

  // Original text: "Remove user from Group"
  removeUserFromGroup: 'Remover usuário do Grupo',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Você tem certeza que deseja deletar este usuário?',

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

  // Original text: "Device"
  pifDeviceLabel: 'Dispositivo',

  // Original text: "Network"
  pifNetworkLabel: 'Rede',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Endereço',

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

  // Original text: "Add a storage"
  addSrDeviceButton: 'Adicionar um armazenamento',

  // Original text: "Name"
  srNameLabel: 'Nome',

  // Original text: "Type"
  srType: 'Tipo',

  // Original text: "Status"
  pdbStatus: 'Status',

  // Original text: "Connected"
  pbdStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Desconectado',

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

  // Original text: "Release date"
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

  // Original text: "Downloaded patches"
  hostInstalledPatches: 'Baixar correções',

  // Original text: "Missing patches"
  hostMissingPatches: 'Correções faltando',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Host pronto para atualizar!',

  // Original text: "General"
  generalTabName: 'Geral',

  // Original text: "Stats"
  statsTabName: 'Estatísticas',

  // Original text: "Console"
  consoleTabName: 'Console',

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
  tipConsoleLabel: 'Teclados fora do padrão US-Keyboard podem apresentar problemas com o console: Altere seu teclado e verifique!',

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

  // Original text: "Tags"
  vdiTags: 'Etiquetas',

  // Original text: "Size"
  vdiSize: 'Tamanho',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: "Boot flag"
  vdbBootableStatus: 'Indicador de inicialização',

  // Original text: "Status"
  vdbStatus: 'Status',

  // Original text: "Connected"
  vbdStatusConnected: 'Conectado',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Desconectado',

  // Original text: "No disks"
  vbdNoVbd: 'Nenhum disco encontrado',

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

  // Original text: "IP addresses"
  vifIpAddresses: 'Endereço IP',

  // Original text: "No snapshots"
  noSnapshots: 'Nenhum snapshot encontrado',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Novo snapshot',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Clique sobre o botão snapshop para criar!',

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

  // Original text: "Default"
  defaultCpuWeight: 'Padrão',

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

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Pool{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Host{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'VM{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage"
  memoryStatePanel: 'Utilização da RAM',

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

  // Original text: "of"
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

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'Nenhum dado encontrado',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Erro de estatísticas',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Não há estatísticas disponíveis para:',

  // Original text: "No selected metric"
  noSelectedMetric: 'Nenhuma métrica selecionada',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Selecionar',

  // Original text: "Loading…"
  metricsLoading: 'Carregando...',

  // Original text: "Coming soon!"
  comingSoon: 'Em breve!',

  // Original text: "Orphaned VDIs"
  orphanedVdis: 'VDI órfãs',

  // Original text: "Orphaned VMs"
  orphanedVms: 'VMs órfãs',

  // Original text: "No orphans"
  noOrphanedObject: 'Sem órfãos',

  // Original text: "Remove all orphaned VDIs"
  removeAllOrphanedObject: 'Remover todos os VDIs órfãos',

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

  // Original text: "Create a new VM on {pool}"
  newVmCreateNewVmOn: 'Criar uma nova VM em {pool}',

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

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Definições de instalação',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Rede',

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

  // Original text: "Quarter (1/4)"
  newVmCpuWeightQuarter: 'Um quarto (1/4)',

  // Original text: "Half (1/2)"
  newVmCpuWeightHalf: 'Meio (1/2)',

  // Original text: "Normal"
  newVmCpuWeightNormal: 'Normal',

  // Original text: "Double (x2)"
  newVmCpuWeightDouble: 'Dobro (x2)',

  // Original text: "Cloud config"
  newVmCloudConfig: 'Configuração do Cloud',

  // Original text: "Resource sets"
  resourceSets: 'Ajustes dos recursos',

  // Original text: "Resource set name"
  resourceSetName: 'Ajuste de nome do recurso',

  // Original text: "Creation and edition"
  resourceSetCreation: 'Criação e edição',

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
  deleteResourceSetQuestion: 'Você tem certeza que deseja deletar este grupo de recurso?',

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
  availableHostsDescription: 'VMs criadas a partir desse conjunto de recursos deve ser executado nos seguintes hosts.',

  // Original text: "Maximum CPUs"
  maxCpus: 'Limite de CPUs',

  // Original text: "Maximum RAM (GiB)"
  maxRam: 'Limite de RAM (GiB)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Limite de espaço do disco',

  // Original text: "No limits."
  noResourceSetLimits: 'Sem limites',

  // Original text: "Total:"
  totalResource: 'Total',

  // Original text: "Remaining:"
  remainingResource: 'Restando;',

  // Original text: "Used:"
  usedResource: 'Usado:',

  // Original text: "Try dropping some backups here, or click to select backups to upload. Accept only .xva files."
  importVmsList: 'Tente soltar alguns backups aqui, ou clique para selecionar backups que seja feito o upload. Apenas arquivos .xva são aceitos.',

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
  startVmImport: 'Iniciando importação...',

  // Original text: "Export starting…"
  startVmExport: 'Iniciando exportação...',

  // Original text: "No pending tasks"
  noTasks: 'Nenhuma tarefa pendente',

  // Original text: "Currently, there isn't any pending XenServer tasks"
  xsTasks: 'Atualmente nenhuma tarefa esta pendente no XenServer',

  // Original text: "delta"
  delta: 'delta',

  // Original text: "Restore Backups"
  restoreBackups: 'Recuperação de Backups',

  // Original text: "No remotes"
  noRemotes: 'Sem remotos (remotes)',

  // Original text: "enabled"
  remoteEnabled: 'Habilitado',

  // Original text: "error"
  remoteError: 'erro',

  // Original text: "No backups available"
  noBackup: 'Nenhum backup disponível',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Iniciar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to start {vms} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Você tem certeza que deseja iniciar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Parar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Você tem certeza que deseja parar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Reiniciar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Você tem certeza que deseja reiniciar {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Snapshot VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Você tem certeza que deseja executar snapshop para {vms} VM{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Deletar VM',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Deletar VM{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: 'Você tem certeza que deseja deletar esta VM? Todos os discos de VM serão removidos',

  // Original text: "Are you sure you want to delete {vms} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage: 'Você tem certeza que deseja deletar {vms} VM{vms, plural, one {} other {s}}? Todos os discos de VM serão removidos',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Migrar VM',

  // Original text: "Are you sure you want to migrate this VM to {hostName}?"
  migrateVmModalBody: 'Você tem certeza que deseja migrar esta VM para {hostName}?',

  // Original text: "Select a destination host:"
  migrateVmAdvancedModalSelectHost: 'Selecionar um host de destino:',

  // Original text: "Select a migration network:"
  migrateVmAdvancedModalSelectNetwork: 'Selecionar uma rede de migração:',

  // Original text: "For each VDI, select an SR:"
  migrateVmAdvancedModalSelectSrs: 'Selecionar um SR:',

  // Original text: "For each VIF, select a network:"
  migrateVmAdvancedModalSelectNetworks: 'Selecionar uma rede',

  // Original text: "Name"
  migrateVmAdvancedModalName: 'Nome',

  // Original text: "SR"
  migrateVmAdvancedModalSr: 'SR',

  // Original text: "VIF"
  migrateVmAdvancedModalVif: 'VIF',

  // Original text: "Network"
  migrateVmAdvancedModalNetwork: 'Rede',

  // Original text: "Import a {name} Backup"
  importBackupModalTitle: 'Importar este Backup: {name}',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Iniciar VM após restauração',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Selecionar backup...',

  // Original text: "Are you sure you want to remove all orphaned VDIs?"
  removeAllOrphanedModalWarning: 'Você tem certeza que deseja remover todos os VDIs orfãos?',

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

  // Original text: "Copy VM"
  copyVm: 'Copiar VM',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Você tem certeza que deseja copiar esta VM para {SR}?',

  // Original text: "Name"
  copyVmName: 'Nome',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Se vazio: Nome da VM copiada',

  // Original text: "Select SR"
  copyVmSelectSr: 'Selecionar SR',

  // Original text: "Use compression"
  copyVmCompress: 'Compressão',

  // Original text: "Create network"
  newNetworkCreate: 'Criar rede',

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

  // Original text: "Delete network"
  deleteNetwork: 'Deletar rede',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Você tem certeza que deseja deletar esta rede?',

  // Original text: "Xen Orchestra"
  xenOrchestra: 'Xen Orchestra',

  // Original text: "server"
  xenOrchestraServer: 'servidor',

  // Original text: "web client"
  xenOrchestraWeb: 'cliente web',

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

  // Original text: "Registration"
  registration: 'Inscrição',

  // Original text: "Trial"
  trial: 'Teste (Trial)',

  // Original text: "Settings"
  settings: 'Configurações',

  // Original text: "Update"
  update: 'Atualizar (Update)',

  // Original text: "Upgrade"
  upgrade: 'Atualização (Upgrade)',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'Nenhuma atualização disponível para a versão Community Edition',

  // Original text: "Please consider subscribe and try it with all features for free during 15 days on"
  noUpdaterSubscribe: 'Oi, inscreva-se e venha testar todos nossos recursos e serviços gratuitamente por 15 dias!',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning: 'Atualização feita de forma manual pode corromper sua instalação atual devido a problema de dependências, tenha cuidado!',

  // Original text: "Current version:"
  currentVersion: 'Versão atual:',

  // Original text: "Register"
  register: 'Registrar',

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
  deletePifConfirm: 'Você tem certeza que deseja conectar este PIF?'
}
