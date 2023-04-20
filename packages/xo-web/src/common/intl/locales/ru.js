// See http://momentjs.com/docs/#/use-it/browserify/
import 'moment/locale/ru'

import reactIntlData from 'react-intl/locale-data/ru'
import { addLocaleData } from 'react-intl'
addLocaleData(reactIntlData)

// ===================================================================

export default {
  // Original text: 'Connecting'
  statusConnecting: 'Подключение',

  // Original text: 'Disconnected'
  statusDisconnected: 'Отключено',

  // Original text: 'Loading…'
  statusLoading: 'Загружается...',

  // Original text: 'Page not found'
  errorPageNotFound: 'Страница не найдена',

  // Original text: 'no such item'
  errorNoSuchItem: 'элемент не найден',

  // Original text: "Long click to edit"
  editableLongClickPlaceholder: 'Длительное нажатие для редактирования',

  // Original text: "Click to edit"
  editableClickPlaceholder: 'Нажмите для редактирования',

  // Original text: 'Browse files'
  browseFiles: 'Просмотреть файлы',

  // Original text: "OK"
  alertOk: 'OK',

  // Original text: "OK"
  confirmOk: 'OK',

  // Original text: "Cancel"
  genericCancel: 'Отмена',

  // Original text: 'On error'
  onError: 'При ошибке',

  // Original text: 'Successful'
  successful: 'Успешно',

  // Original text: 'Managed disks'
  filterOnlyManaged: 'Управляемые диски',

  // Original text: 'Orphaned disks'
  filterOnlyOrphaned: 'Потерянные диски',

  // Original text: 'Normal disks'
  filterOnlyRegular: 'Работающие диски',

  // Original text: 'Snapshot disks'
  filterOnlySnapshots: 'Снимки дисков',

  // Original text: 'Unmanaged disks'
  filterOnlyUnmanaged: 'Неподключенные диски',

  // Original text: 'Copy to clipboard'
  copyToClipboard: 'Копировать в буфер обмена',

  // Original text: 'Master'
  pillMaster: undefined,

  // Original text: "Home"
  homePage: 'Главная',

  // Original text: 'VMs'
  homeVmPage: 'Вируальные машины',

  // Original text: 'Hosts'
  homeHostPage: 'Хосты',

  // Original text: 'Pools'
  homePoolPage: 'Пулы',

  // Original text: 'Templates'
  homeTemplatePage: 'Шаблоны',

  // Original text: 'Storages'
  homeSrPage: 'Хранилища',

  // Original text: "Dashboard"
  dashboardPage: 'Контрольные панели',

  // Original text: "Overview"
  overviewDashboardPage: 'Обзор',

  // Original text: "Visualizations"
  overviewVisualizationDashboardPage: 'Графики',

  // Original text: "Statistics"
  overviewStatsDashboardPage: 'Статистика',

  // Original text: "Health"
  overviewHealthDashboardPage: 'Здоровье',

  // Original text: "Self service"
  selfServicePage: 'Самодиагностика',

  // Original text: "Backup"
  backupPage: 'Резервная копия',

  // Original text: "Jobs"
  jobsPage: 'Задачи',

  // Original text: "Updates"
  updatePage: 'Обновление',

  // Original text: "Settings"
  settingsPage: 'Настройки',

  // Original text: "Servers"
  settingsServersPage: 'Сервисы',

  // Original text: "Users"
  settingsUsersPage: 'Пользователи',

  // Original text: "Groups"
  settingsGroupsPage: 'Группы',

  // Original text: "ACLs"
  settingsAclsPage: 'Управление доступом',

  // Original text: "Plugins"
  settingsPluginsPage: 'Плагины',

  // Original text: 'Logs'
  settingsLogsPage: 'Журналы',

  // Original text: 'IPs'
  settingsIpsPage: 'IP адреса',

  // Original text: 'Config'
  settingsConfigPage: 'Когфигурация',

  // Original text: "About"
  aboutPage: 'О программе',

  // Original text: 'About XO {xoaPlan}'
  aboutXoaPlan: 'О Xen Orchestra {xoaPlan}',

  // Original text: "New"
  newMenu: 'Добавить',

  // Original text: "Tasks"
  taskMenu: 'Задачи',

  // Original text: 'Tasks'
  taskPage: undefined,

  // Original text: "VM"
  newVmPage: 'ВМ',

  // Original text: "Storage"
  newSrPage: 'Хранилище',

  // Original text: "Server"
  newServerPage: 'Сервер',

  // Original text: "Import"
  newImport: 'Импорт',

  // Original text: 'XOSAN'
  xosan: undefined,

  // Original text: "Overview"
  backupOverviewPage: 'Обзор',

  // Original text: "New"
  backupNewPage: 'Создать',

  // Original text: "Remotes"
  backupRemotesPage: 'Удаленный',

  // Original text: "Restore"
  backupRestorePage: 'Восстановление',

  // Original text: 'File restore'
  backupFileRestorePage: 'Восстановление из файла',

  // Original text: "Schedule"
  schedule: 'Расписание',

  // Original text: "New VM backup"
  newVmBackup: 'Новая резервная копия ВМ',

  // Original text: "Edit VM backup"
  editVmBackup: 'Изменить резервную копию ВМ',

  // Original text: "Backup"
  backup: 'Резервная копия',

  // Original text: "Rolling Snapshot"
  rollingSnapshot: 'Прокручивающийся снимок',

  // Original text: "Delta Backup"
  deltaBackup: 'Дельта-резервное копирование',

  // Original text: "Disaster Recovery"
  disasterRecovery: 'Аварийное восстановление',

  // Original text: "Continuous Replication"
  continuousReplication: 'Непрерывная репликация',

  // Original text: "Overview"
  jobsOverviewPage: 'Обзор',

  // Original text: "New"
  jobsNewPage: 'Новый',

  // Original text: "Scheduling"
  jobsSchedulingPage: 'Планирование',

  // Original text: "Custom Job"
  customJob: 'Пользовательская задача',

  // Original text: 'User'
  userPage: 'Пользователь',

  // Original text: 'No support'
  noSupport: 'Не поддерживается',

  // Original text: 'Free upgrade!'
  freeUpgrade: 'Беспланое обновление!',

  // Original text: "Sign out"
  signOut: 'Выйти',

  // Original text: 'Edit my settings {username}'
  editUserProfile: 'Изменить мои настройки {username}',

  // Original text: "Fetching data…"
  homeFetchingData: 'Получение данных…',

  // Original text: "Welcome on Xen Orchestra!"
  homeWelcome: 'Добро пожаловать в Xen Orchestra!',

  // Original text: "Add your XCP-ng hosts or pools"
  homeWelcomeText: 'Добавьте свои хосты и пулы XCP-ng',

  // Original text: 'Some XenServers have been registered but are not connected'
  homeConnectServerText: 'Некоторые серверы XenServer зарегистрированы, но не подключены',

  // Original text: "Want some help?"
  homeHelp: 'Нужна помощь?',

  // Original text: "Add server"
  homeAddServer: 'Добавить сервер',

  // Original text: 'Connect servers'
  homeConnectServer: 'Подключить серверы',

  // Original text: "Online Doc"
  homeOnlineDoc: 'Онлайн документация',

  // Original text: "Pro Support"
  homeProSupport: 'Поддержка уровня "Pro"',

  // Original text: "There are no VMs!"
  homeNoVms: 'Виртуальных машин нет!',

  // Original text: "Or…"
  homeNoVmsOr: 'Или…',

  // Original text: "Import VM"
  homeImportVm: 'Импорт ВМ',

  // Original text: "Import an existing VM in xva format"
  homeImportVmMessage: 'Импорт существующей виртуальной машины в формате xva',

  // Original text: "Restore a backup"
  homeRestoreBackup: 'Восстановить резервную копию',

  // Original text: "Restore a backup from a remote store"
  homeRestoreBackupMessage: 'Восстановить резервную копию из удаленного хранилища',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Это создаст новую виртуальную машину',

  // Original text: "Filters"
  homeFilters: 'Фильтры',

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: 'Ничего не найдено! Нажмите здась что бы сбросить фильтры',

  // Original text: "Pool"
  homeTypePool: 'Пул',

  // Original text: "Host"
  homeTypeHost: 'Хост',

  // Original text: "VM"
  homeTypeVm: 'ВМ',

  // Original text: "SR"
  homeTypeSr: 'SR',

  // Original text: 'Template'
  homeTypeVmTemplate: 'Шаблон',

  // Original text: "Sort"
  homeSort: 'Сортировка',

  // Original text: "Pools"
  homeAllPools: 'Пулы',

  // Original text: "Hosts"
  homeAllHosts: 'Хосты',

  // Original text: "Tags"
  homeAllTags: 'Тэги',

  // Original text: "New VM"
  homeNewVm: 'Новая ВМ',

  // Original text: 'None'
  homeFilterNone: undefined,

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Работающие хосты',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Отключенные хосты',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'Работающие ВМ',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: 'Выключенные ВМ',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'Ожидание ВМ',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'Гости HVM',

  // Original text: "Tags"
  homeFilterTags: 'Тэги',

  // Original text: "Sort by"
  homeSortBy: 'Сортировать по',

  // Original text: "Name"
  homeSortByName: 'Название',

  // Original text: "Power state"
  homeSortByPowerstate: 'Статус',

  // Original text: "RAM"
  homeSortByRAM: 'Виртуальная память',

  // Original text: "vCPUs"
  homeSortByvCPUs: 'vCPUs',

  // Original text: 'CPUs'
  homeSortByCpus: undefined,

  // Original text: 'Shared/Not shared'
  homeSortByShared: 'Совместное использование/Без совместного использования',

  // Original text: 'Size'
  homeSortBySize: 'Размер',

  // Original text: 'Usage'
  homeSortByUsage: 'Используется',

  // Original text: 'Type'
  homeSortByType: 'Тип',

  // Original text: "{displayed, number}x {icon} (on {total, number})"
  homeDisplayedItems: '{displayed, number}x {icon} (на {total, number})',

  // Original text: "{selected, number}x {icon} selected (on {total, number})"
  homeSelectedItems: '{selected, number}x {icon} выбраных (на {total, number})',

  // Original text: "More"
  homeMore: 'Больше',

  // Original text: "Migrate to…"
  homeMigrateTo: 'Переместить на…',

  // Original text: 'Missing patches'
  homeMissingPatches: 'Патчей нет',

  // Original text: 'Master:'
  homePoolMaster: undefined,

  // Original text: 'Resource set: {resourceSet}'
  homeResourceSet: 'Набор ресурсов',

  // Original text: 'High Availability'
  highAvailability: 'Высокая доступность',

  // Original text: 'Shared {type}'
  srSharedType: 'Совместное использование {type}',

  // Original text: 'Not shared {type}'
  srNotSharedType: 'Без совместного использования {type}',

  // Original text: "Add"
  add: 'Добавить',

  // Original text: 'Select all'
  selectAll: 'Выбрать всё',

  // Original text: "Remove"
  remove: 'Удалить',

  // Original text: "Preview"
  preview: 'Предпросмотр',

  // Original text: "Item"
  item: 'Элемент',

  // Original text: "No selected value"
  noSelectedValue: 'Значение не выбрано',

  // Original text: "Choose user(s) and/or group(s)"
  selectSubjects: 'Выберите пользователя(ей) и/или группу(ы)',

  // Original text: "Select Object(s)…"
  selectObjects: 'Выберите объект(ы)…',

  // Original text: "Choose a role"
  selectRole: 'Выберите роль',

  // Original text: "Select Host(s)…"
  selectHosts: 'Выберите Хост(ы)…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Выберите объект(ы)…',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Выберите сеть/сети…',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Выберите физический(ие) сетевой(вые) интерфейс(ы)…',

  // Original text: "Select Pool(s)…"
  selectPools: 'Выберите Пул(ы)…',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Выберите удаленное(ые) хранилище(я)…',

  // Original text: 'Select resource set(s)…'
  selectResourceSets: 'Выберите набор(ы) ресурсов',

  // Original text: 'Select template(s)…'
  selectResourceSetsVmTemplate: 'Выберите шаблон(ы)…',

  // Original text: 'Select SR(s)…'
  selectResourceSetsSr: 'Выберите SR(s)…',

  // Original text: 'Select network(s)…'
  selectResourceSetsNetwork: 'Выберите сеть(и)…',

  // Original text: 'Select disk(s)…'
  selectResourceSetsVdi: 'Выберите диск(и)…',

  // Original text: 'Select SSH key(s)…'
  selectSshKey: 'Выберите SSH-ключ(и)…',

  // Original text: "Select SR(s)…"
  selectSrs: 'Выберите SR(s)…',

  // Original text: "Select VM(s)…"
  selectVms: 'Выберите виртуальную(ые) машину(ы)…',

  // Original text: "Select VM template(s)…"
  selectVmTemplates: 'Выберите шаблон(ы) ВМ…',

  // Original text: "Select tag(s)…"
  selectTags: 'Выберите тэги(s)…',

  // Original text: "Select disk(s)…"
  selectVdis: 'Выберите диск(и)…',

  // Original text: 'Select timezone…'
  selectTimezone: 'Выберите часовой пояс…',

  // Original text: 'Select IP(s)…'
  selectIp: 'Выберите IP-адрес(а)…',

  // Original text: 'Select IP pool(s)…'
  selectIpPool: 'Выберите пул(ы) IP-адресов…',

  // Original text: "Fill required informations."
  fillRequiredInformations: 'Введите данные (обязательно)',

  // Original text: "Fill informations (optional)"
  fillOptionalInformations: 'Введите данные (опционально)',

  // Original text: "Reset"
  selectTableReset: 'Сброс',

  // Original text: "Month"
  schedulingMonth: 'Месяц',

  // Original text: 'Every N month'
  schedulingEveryNMonth: 'Каждый N-й месяц',

  // Original text: "Each selected month"
  schedulingEachSelectedMonth: 'Каждый выбранный месяц',

  // Original text: 'Day'
  schedulingDay: 'День',

  // Original text: 'Every N day'
  schedulingEveryNDay: 'Каждый N-й день',

  // Original text: "Each selected day"
  schedulingEachSelectedDay: 'Каждый выбранный день',

  // Original text: 'Switch to week days'
  schedulingSetWeekDayMode: 'Переключиться на дни недели',

  // Original text: 'Switch to month days'
  schedulingSetMonthDayMode: 'Переключиться на дни месяца',

  // Original text: "Hour"
  schedulingHour: 'Час',

  // Original text: "Each selected hour"
  schedulingEachSelectedHour: 'Каждый выбранный час',

  // Original text: "Every N hour"
  schedulingEveryNHour: 'Каждый N-й час',

  // Original text: "Minute"
  schedulingMinute: 'Минута',

  // Original text: "Each selected minute"
  schedulingEachSelectedMinute: 'Каждый выбранная минута',

  // Original text: "Every N minute"
  schedulingEveryNMinute: 'Каждый N-ая минута',

  // Original text: 'Every month'
  selectTableAllMonth: 'Каждый месяц',

  // Original text: 'Every day'
  selectTableAllDay: 'Каждый день',

  // Original text: 'Every hour'
  selectTableAllHour: 'Каждый час',

  // Original text: 'Every minute'
  selectTableAllMinute: 'Каждую минуту',

  // Original text: "Reset"
  schedulingReset: 'Сброс',

  // Original text: "Unknown"
  unknownSchedule: 'Неизвестно',

  // Original text: 'Web browser timezone'
  timezonePickerUseLocalTime: 'Часовой пояс WEB-браузера',

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: 'Часовой пояс сервера ({value})',

  // Original text: 'Cron Pattern:'
  cronPattern: 'Cron-шаблон: ',

  // Original text: "Cannot edit backup"
  backupEditNotFoundTitle: 'Невозможно изменить резервную копию',

  // Original text: "Missing required info for edition"
  backupEditNotFoundMessage: 'Отсутствует информация, необходимая для редактирования',

  // Original text: 'Successful'
  successfulJobCall: 'Успешно',

  // Original text: 'Failed'
  failedJobCall: 'Провал',

  // Original text: 'In progress'
  jobCallInProgess: 'В процессе',

  // Original text: 'size:'
  jobTransferredDataSize: 'размер',

  // Original text: 'speed:'
  jobTransferredDataSpeed: 'скорость',

  // Original text: "Job"
  job: 'Задача',

  // Original text: 'Job {job}'
  jobModalTitle: 'Задача {job}',

  // Original text: "ID"
  jobId: 'ID задачи',

  // Original text: 'Type'
  jobType: 'Тип',

  // Original text: "Name"
  jobName: 'Имя',

  // Original text: 'Name of your job (forbidden: "_")'
  jobNamePlaceholder: 'Данное имя для вашей задачи (запрещено: "_")',

  // Original text: "Start"
  jobStart: 'Начало',

  // Original text: "End"
  jobEnd: 'Конец',

  // Original text: "Duration"
  jobDuration: 'Длительность',

  // Original text: "Status"
  jobStatus: 'Статус',

  // Original text: "Action"
  jobAction: 'Действие',

  // Original text: "Tag"
  jobTag: 'Тэг',

  // Original text: "Scheduling"
  jobScheduling: 'Планирование',

  // Original text: "State"
  jobState: 'Состояние',

  // Original text: 'Enabled'
  jobStateEnabled: 'Активина',

  // Original text: 'Disabled'
  jobStateDisabled: 'Отключена',

  // Original text: 'Timezone'
  jobTimezone: 'Часовой пояс',

  // Original text: 'Server'
  jobServerTimezone: 'Сервер',

  // Original text: "Run job"
  runJob: 'Запустить задачу',

  // Original text: "One shot running started. See overview for logs."
  runJobVerbose: 'Запуск резервного копирования вручную. Перейдите к сводке, чтобы просмотреть журналы.',

  // Original text: "Started"
  jobStarted: 'Запущена',

  // Original text: "Finished"
  jobFinished: 'Завершена',

  // Original text: "Save"
  saveBackupJob: 'Сохранить',

  // Original text: "Remove backup job"
  deleteBackupSchedule: 'Удалить задание на резервное копирование',

  // Original text: "Are you sure you want to delete this backup job?"
  deleteBackupScheduleQuestion: 'Вы уверены, что хотите удалить это задание резервного копирования?',

  // Original text: "Enable immediately after creation"
  scheduleEnableAfterCreation: 'Активировать сразу после создания',

  // Original text: "You are editing Schedule {name} ({id}). Saving will override previous schedule state."
  scheduleEditMessage: 'Вы редактируете расписание {name} ({id}). Текущее состояние будет изменено при сохранении.',

  // Original text: "You are editing job {name} ({id}). Saving will override previous job state."
  jobEditMessage: 'Вы редактируете задачу {name} ({id}). Текущее состояние будет изменено при сохранении.',

  // Original text: "No scheduled jobs."
  noScheduledJobs: 'Нет запланированных задач',

  // Original text: "No jobs found."
  noJobs: 'Задачи не найдены',

  // Original text: "No schedules found"
  noSchedules: 'Расписания не найдены',

  // Original text: "Select a xo-server API command"
  jobActionPlaceHolder: 'Выберите команду API xo-server',

  // Original text: ' Timeout (number of seconds after which a VM is considered failed)'
  jobTimeoutPlaceHolder: 'Тайм-аут (количество секунд, после которого виртуальная машина считается неисправной)',

  // Original text: 'Schedules'
  jobSchedules: 'Расписания',

  // Original text: 'Name of your schedule'
  jobScheduleNamePlaceHolder: 'Название расписания',

  // Original text: 'Select a Job'
  jobScheduleJobPlaceHolder: 'Выберите задачу',

  // Original text: 'Job owner'
  jobOwnerPlaceholder: 'Администратор задачи',

  // Original text: "This job's creator no longer exists"
  jobUserNotFound: 'Администратор этой задачи больше не существует',

  // Original text: "This backup's creator no longer exists"
  backupUserNotFound: 'Администратор этой резервной копии больше не существует',

  // Original text: 'Backup owner'
  backupOwner: 'Администратор резервной копии',

  // Original text: "Select your backup type:"
  newBackupSelection: 'Выберите тип резервной копиии:',

  // Original text: 'Select backup mode:'
  smartBackupModeSelection: 'Выберите режим резервного копирования',

  // Original text: 'Normal backup'
  normalBackup: 'Обычное резервное копирование',

  // Original text: 'Smart backup'
  smartBackup: '"Умное" резервное копирование',

  // Original text: 'Local remote selected'
  localRemoteWarningTitle: undefined,

  // Original text: 'Warning: local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage:
    'Предупреждение: локальные удаленные устройства будут использовать ограниченное дисковое пространство XOA. Только для продвинутых пользователей.',

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

  // Original text: 'Depth'
  editBackupDepthTitle: undefined,

  // Original text: 'Remote'
  editBackupRemoteTitle: undefined,

  // Original text: 'Delete the old backups first'
  deleteOldBackupsFirst: undefined,

  // Original text: "Remote stores for backup"
  remoteList: 'Удаленное хранилище для резервного копирования',

  // Original text: "New File System Remote"
  newRemote: 'Новая удаленная файловая система',

  // Original text: "Local"
  remoteTypeLocal: 'Локально',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: 'Тип',

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
  newSrGeneral: 'Общий',

  // Original text: "Select Storage Type:"
  newSrTypeSelection: 'Выберите тип хранилища:',

  // Original text: "Settings"
  newSrSettings: 'Настройки',

  // Original text: "Storage Usage"
  newSrUsage: 'Использование хранилища',

  // Original text: "Summary"
  newSrSummary: 'Суммарно',

  // Original text: "Host"
  newSrHost: 'Хост',

  // Original text: "Type"
  newSrType: 'Тип',

  // Original text: "Name"
  newSrName: 'Имя',

  // Original text: "Description"
  newSrDescription: 'Описание',

  // Original text: "Server"
  newSrServer: 'Сервер',

  // Original text: "Path"
  newSrPath: 'Путь',

  // Original text: "IQN"
  newSrIqn: 'IQN',

  // Original text: "LUN"
  newSrLun: 'LUN',

  // Original text: "with auth."
  newSrAuth: 'с аутентификацией.',

  // Original text: "User Name"
  newSrUsername: 'Имя пользователя',

  // Original text: "Password"
  newSrPassword: 'Пароль',

  // Original text: "Device"
  newSrDevice: 'Устройство',

  // Original text: "in use"
  newSrInUse: 'используется',

  // Original text: "Size"
  newSrSize: 'Размер',

  // Original text: "Create"
  newSrCreate: 'Создать',

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
  subjectName: 'Пользователи/Группы',

  // Original text: "Object"
  objectName: 'Обьект',

  // Original text: 'No acls found'
  aclNoneFound: undefined,

  // Original text: "Role"
  roleName: 'Роль',

  // Original text: 'Create'
  aclCreate: undefined,

  // Original text: "New Group Name"
  newGroupName: 'Имя новой группы',

  // Original text: "Create Group"
  createGroup: 'Создать группу',

  // Original text: "Create"
  createGroupButton: 'Создать',

  // Original text: "Delete Group"
  deleteGroup: 'Удалить группу',

  // Original text: "Are you sure you want to delete this group?"
  deleteGroupConfirm: 'Вы уверены, что хотите удалить эту группу?',

  // Original text: "Remove user from Group"
  removeUserFromGroup: 'Удалить пользователя из группы?',

  // Original text: "Are you sure you want to delete this user?"
  deleteUserConfirm: 'Вы уверены, что хотите удалить этого пользователя?',

  // Original text: "Delete User"
  deleteUser: 'Удалить пользователя',

  // Original text: 'no user'
  noUser: undefined,

  // Original text: "unknown user"
  unknownUser: 'неизвестный пользователь',

  // Original text: "No group found"
  noGroupFound: 'Группа не найдена',

  // Original text: "Name"
  groupNameColumn: 'Имя',

  // Original text: "Users"
  groupUsersColumn: 'Пользователи',

  // Original text: "Add User"
  addUserToGroupColumn: 'Добавить пользователя',

  // Original text: "Email"
  userNameColumn: 'Email',

  // Original text: "Permissions"
  userPermissionColumn: 'Разрешения',

  // Original text: "Password"
  userPasswordColumn: 'Пароль',

  // Original text: "Email"
  userName: 'Email',

  // Original text: "Password"
  userPassword: 'Пароль',

  // Original text: "Create"
  createUserButton: 'Создать',

  // Original text: "No user found"
  noUserFound: 'Пользователь не найден',

  // Original text: "User"
  userLabel: 'Пользователь',

  // Original text: "Admin"
  adminLabel: 'Admin',

  // Original text: "No user in group"
  noUserInGroup: 'Пользователь не в группе',

  // Original text: "{users, number} user{users, plural, one {} other {s}}"
  countUsers: '{users, number} пользователь{users, plural, one {} other {s}}',

  // Original text: "Select Permission"
  selectPermission: 'Укажите разрешения',

  // Original text: 'No plugins found'
  noPlugins: undefined,

  // Original text: "Auto-load at server start"
  autoloadPlugin: 'Автозагрузка при запуске сервера',

  // Original text: "Save configuration"
  savePluginConfiguration: 'Сохранить конфигурацию',

  // Original text: "Delete configuration"
  deletePluginConfiguration: 'Удалить конфигурацию',

  // Original text: "Plugin error"
  pluginError: 'Ошибка плагина',

  // Original text: "Unknown error"
  unknownPluginError: 'Неизвестная ошибка',

  // Original text: "Purge plugin configuration"
  purgePluginConfiguration: 'Сбросить конфирурацию плагина',

  // Original text: "Are you sure you want to purge this configuration ?"
  purgePluginConfigurationQuestion: 'Вы уверены, что хотите сбросить эту конфигурацию?',

  // Original text: "Edit"
  editPluginConfiguration: 'Изменить',

  // Original text: "Cancel"
  cancelPluginEdition: 'Отменить',

  // Original text: "Plugin configuration"
  pluginConfigurationSuccess: 'Конфигурация плагина',

  // Original text: "Plugin configuration successfully saved!"
  pluginConfigurationChanges: 'Конфигурация плагина успешно сохранена!',

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
  startVmLabel: 'Запустить',

  // Original text: "Recovery start"
  recoveryModeLabel: 'Запустить восстановление',

  // Original text: "Suspend"
  suspendVmLabel: 'Приостановить',

  // Original text: "Stop"
  stopVmLabel: 'Остановить',

  // Original text: "Force shutdown"
  forceShutdownVmLabel: 'Принудительное выключение',

  // Original text: "Reboot"
  rebootVmLabel: 'Перезагрузка',

  // Original text: "Force reboot"
  forceRebootVmLabel: 'Принудительная перезагрузка',

  // Original text: "Delete"
  deleteVmLabel: 'Удалить',

  // Original text: "Migrate"
  migrateVmLabel: 'Переместить',

  // Original text: "Snapshot"
  snapshotVmLabel: 'Снимок',

  // Original text: "Export"
  exportVmLabel: 'Экспорт',

  // Original text: "Resume"
  resumeVmLabel: 'Проводлжить',

  // Original text: "Copy"
  copyVmLabel: 'Копировать',

  // Original text: "Clone"
  cloneVmLabel: 'Клонировать',

  // Original text: "Fast clone"
  fastCloneVmLabel: 'Быстрое клонирование',

  // Original text: "Convert to template"
  convertVmToTemplateLabel: 'Преобразовать в шаблон',

  // Original text: "Console"
  vmConsoleLabel: 'Консоль',

  // Original text: "Rescan all disks"
  srRescan: 'Перечитать все диски',

  // Original text: "Connect to all hosts"
  srReconnectAll: 'Подключить ко всем хостам',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Отключить от всех хостов',

  // Original text: "Forget this SR"
  srForget: 'Забыть этот SR',

  // Original text: 'Forget SRs'
  srsForget: undefined,

  // Original text: "Remove this SR"
  srRemoveButton: 'Удалить этот SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'На этом хранилище нет VDI',

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
  hostsTabName: 'Хосты',

  // Original text: 'Vms'
  vmsTabName: undefined,

  // Original text: 'Srs'
  srsTabName: undefined,

  // Original text: "High Availability"
  poolHaStatus: 'Высокая доступность',

  // Original text: "Enabled"
  poolHaEnabled: 'Включена',

  // Original text: "Disabled"
  poolHaDisabled: 'Выключена',

  // Original text: "Name"
  hostNameLabel: 'Имя',

  // Original text: "Description"
  hostDescription: 'Описание',

  // Original text: "Memory"
  hostMemory: 'Память',

  // Original text: "No hosts"
  noHost: 'Нет хостов',

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: undefined,

  // Original text: 'PIF'
  pif: undefined,

  // Original text: "Name"
  poolNetworkNameLabel: 'Имя',

  // Original text: "Description"
  poolNetworkDescription: 'Описание',

  // Original text: "PIFs"
  poolNetworkPif: 'PIFs',

  // Original text: "No networks"
  poolNoNetwork: 'Нет сетей',

  // Original text: "MTU"
  poolNetworkMTU: 'MTU',

  // Original text: "Connected"
  poolNetworkPifAttached: 'Подключено',

  // Original text: "Disconnected"
  poolNetworkPifDetached: 'Отключено',

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
  addSrLabel: 'Добавить SR',

  // Original text: "Add VM"
  addVmLabel: 'Добавить ВМ',

  // Original text: "Add Host"
  addHostLabel: 'Добавить хост',

  // Original text: 'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.'
  hostNeedsPatchUpdate: undefined,

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: undefined,

  // Original text: 'Adding host failed'
  addHostErrorTitle: undefined,

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: undefined,

  // Original text: "Disconnect"
  disconnectServer: 'Отключен',

  // Original text: "Start"
  startHostLabel: 'Запустить',

  // Original text: "Stop"
  stopHostLabel: 'Остановить',

  // Original text: "Enable"
  enableHostLabel: 'Включить',

  // Original text: "Disable"
  disableHostLabel: 'Выключить',

  // Original text: "Restart toolstack"
  restartHostAgent: 'Перезапустить службы',

  // Original text: "Force reboot"
  forceRebootHostLabel: 'Быстрая перезагрузка',

  // Original text: "Reboot"
  rebootHostLabel: 'Перезагрузка',

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
  emergencyModeLabel: 'Режим восстановления',

  // Original text: "Storage"
  storageTabName: 'Хранилище',

  // Original text: "Patches"
  patchesTabName: 'Патчи',

  // Original text: "Load average"
  statLoad: 'Средняя нагрузка',

  // Original text: 'RAM Usage: {memoryUsed}'
  memoryHostState: undefined,

  // Original text: "Hardware"
  hardwareHostSettingsLabel: 'Hardware',

  // Original text: "Address"
  hostAddress: 'Адрес',

  // Original text: "Status"
  hostStatus: 'Статус',

  // Original text: "Build number"
  hostBuildNumber: 'Номер сборки',

  // Original text: "iSCSI name"
  hostIscsiName: 'Имя iSCSI',

  // Original text: "Version"
  hostXenServerVersion: 'Версия',

  // Original text: "Enabled"
  hostStatusEnabled: 'Включен',

  // Original text: "Disabled"
  hostStatusDisabled: 'Выключен',

  // Original text: "Power on mode"
  hostPowerOnMode: 'Режим включения',

  // Original text: "Host uptime"
  hostStartedSince: 'Время работы хоста',

  // Original text: "Toolstack uptime"
  hostStackStartedSince: 'Время работы служб',

  // Original text: "CPU model"
  hostCpusModel: 'Модель CPU',

  // Original text: "Core (socket)"
  hostCpusNumber: 'Ядра (сокеты)',

  // Original text: "Manufacturer info"
  hostManufacturerinfo: 'Производитель',

  // Original text: "BIOS info"
  hostBiosinfo: 'BIOS',

  // Original text: "Licence"
  licenseHostSettingsLabel: 'Лицензия',

  // Original text: "Type"
  hostLicenseType: 'Тип',

  // Original text: "Socket"
  hostLicenseSocket: 'Сокет',

  // Original text: "Expiry"
  hostLicenseExpiry: 'Срок действия',

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
  networkCreateButton: 'Добавить сеть',

  // Original text: 'Add a bonded network'
  networkCreateBondedButton: undefined,

  // Original text: "Device"
  pifDeviceLabel: 'Устройство',

  // Original text: "Network"
  pifNetworkLabel: 'Сеть',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Адрес',

  // Original text: 'Mode'
  pifModeLabel: undefined,

  // Original text: "MAC"
  pifMacLabel: 'MAC',

  // Original text: "MTU"
  pifMtuLabel: 'MTU',

  // Original text: "Status"
  pifStatusLabel: 'Статус',

  // Original text: "Connected"
  pifStatusConnected: 'Подключен',

  // Original text: "Disconnected"
  pifStatusDisconnected: 'Отключен',

  // Original text: "No physical interface detected"
  pifNoInterface: 'Физический интерфейс не обнаружен',

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
  addSrDeviceButton: 'Добавить хранилище',

  // Original text: "Name"
  srNameLabel: 'Имя',

  // Original text: "Type"
  srType: 'Тип',

  // Original text: 'Action'
  pbdAction: undefined,

  // Original text: "Status"
  pbdStatus: 'Статус',

  // Original text: "Connected"
  pbdStatusConnected: 'Подключен',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Отключен',

  // Original text: 'Connect'
  pbdConnect: undefined,

  // Original text: 'Disconnect'
  pbdDisconnect: undefined,

  // Original text: 'Forget'
  pbdForget: undefined,

  // Original text: "Shared"
  srShared: 'С общим доступом',

  // Original text: "Not shared"
  srNotShared: 'Без общего доступа',

  // Original text: "No storage detected"
  pbdNoSr: 'Хранилище не обнаружено',

  // Original text: "Name"
  patchNameLabel: 'Имя',

  // Original text: "Install all patches"
  patchUpdateButton: 'Установить все патчи',

  // Original text: "Description"
  patchDescription: 'Описание',

  // Original text: "Applied date"
  patchApplied: 'Дата публикации',

  // Original text: "Size"
  patchSize: 'Размер',

  // Original text: "Status"
  patchStatus: 'Статус',

  // Original text: "Applied"
  patchStatusApplied: 'Применяемый',

  // Original text: "Missing patches"
  patchStatusNotApplied: 'Отсутствующие патчи',

  // Original text: "No patch detected"
  patchNothing: 'Патчи не найдены',

  // Original text: "Release date"
  patchReleaseDate: 'Дата релиза',

  // Original text: "Guidance"
  patchGuidance: 'Руководство',

  // Original text: "Action"
  patchAction: 'Дествие',

  // Original text: 'Applied patches'
  hostAppliedPatches: undefined,

  // Original text: "Missing patches"
  hostMissingPatches: 'Патчи не найдены',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Хост в актуальном состоянии!',

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
  generalTabName: 'Общее',

  // Original text: "Stats"
  statsTabName: 'Статистика',

  // Original text: "Console"
  consoleTabName: 'Консоль',

  // Original text: 'Container'
  containersTabName: undefined,

  // Original text: "Snapshots"
  snapshotsTabName: 'Снимки',

  // Original text: "Logs"
  logsTabName: 'Журналы',

  // Original text: "Advanced"
  advancedTabName: 'Расширено',

  // Original text: "Network"
  networkTabName: 'Сеть',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Диск{disks, plural, one {} other {s}}',

  // Original text: "halted"
  powerStateHalted: 'остановлен',

  // Original text: "running"
  powerStateRunning: 'работает',

  // Original text: "suspended"
  powerStateSuspended: 'приостановлен',

  // Original text: "No Xen tools detected"
  vmStatus: 'Утилиты XEN не обнаружены',

  // Original text: "No IPv4 record"
  vmName: 'Нет IPv4-записи',

  // Original text: "No IP record"
  vmDescription: 'Нет IP-записи',

  // Original text: "Started {ago}"
  vmSettings: 'Запущена {ago}',

  // Original text: "Current status:"
  vmCurrentStatus: 'Текущий статус',

  // Original text: "Not running"
  vmNotRunning: 'Не запущена',

  // Original text: 'Halted {ago}'
  vmHaltedSince: undefined,

  // Original text: "No Xen tools detected"
  noToolsDetected: 'Утилиты XEN не обнаружены',

  // Original text: "No IPv4 record"
  noIpv4Record: 'Нет IPv4-записи',

  // Original text: "No IP record"
  noIpRecord: 'Нет IP-записи',

  // Original text: "Started {ago}"
  started: 'Запущена {ago}',

  // Original text: "Paravirtualization (PV)"
  paraVirtualizedMode: 'Паравиртуализация (PV)',

  // Original text: "Hardware virtualization (HVM)"
  hardwareVirtualizedMode: 'Аппаратная паравиртуализация (HVM)',

  // Original text: "CPU usage"
  statsCpu: 'Использование CPU',

  // Original text: "Memory usage"
  statsMemory: 'Использование памяти',

  // Original text: "Network throughput"
  statsNetwork: 'Использование сети',

  // Original text: 'Stacked values'
  useStackedValuesOnStats: undefined,

  // Original text: "Disk throughput"
  statDisk: 'Использование диска',

  // Original text: "Last 10 minutes"
  statLastTenMinutes: 'Последние 10 минут',

  // Original text: "Last 2 hours"
  statLastTwoHours: 'Последние 2 часа',

  // Original text: "Last week"
  statLastWeek: 'Последняя неделя',

  // Original text: "Last year"
  statLastYear: 'Последний год',

  // Original text: "Copy"
  copyToClipboardLabel: 'Копировать',

  // Original text: "Ctrl+Alt+Del"
  ctrlAltDelButtonLabel: 'Ctrl+Alt+Del',

  // Original text: "Tip:"
  tipLabel: 'Совет:',

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
  vdiAction: 'Действие',

  // Original text: "Attach disk"
  vdiAttachDevice: 'Подклчить диск',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Новый диск',

  // Original text: "Boot order"
  vdiBootOrder: 'Очередность загрузки',

  // Original text: "Name"
  vdiNameLabel: 'Имя',

  // Original text: "Description"
  vdiNameDescription: 'Описание',

  // Original text: 'Pool'
  vdiPool: undefined,

  // Original text: 'Disconnect'
  vdiDisconnect: undefined,

  // Original text: "Tags"
  vdiTags: 'Тэги',

  // Original text: "Size"
  vdiSize: 'Размер',

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

  // Original text: 'No VDIs attached to Control Domain'
  noControlDomainVdis: undefined,

  // Original text: "Boot flag"
  vbdBootableStatus: 'Флаг загрузки',

  // Original text: "Status"
  vbdStatus: 'Статус',

  // Original text: "Connected"
  vbdStatusConnected: 'Подключен',

  // Original text: "Disconnected"
  vbdStatusDisconnected: 'Отключен',

  // Original text: "No disks"
  vbdNoVbd: 'Нет дисков',

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

  // Original text: "New device"
  vifCreateDeviceButton: 'Новое устройство',

  // Original text: "No interface"
  vifNoInterface: 'Нет интерфейса',

  // Original text: "Device"
  vifDeviceLabel: 'Устройство',

  // Original text: "MAC address"
  vifMacLabel: 'MAC-адрес',

  // Original text: "MTU"
  vifMtuLabel: 'MTU',

  // Original text: "Network"
  vifNetworkLabel: 'Сеть',

  // Original text: "Status"
  vifStatusLabel: 'Статус',

  // Original text: "Connected"
  vifStatusConnected: 'Подключен',

  // Original text: "Disconnected"
  vifStatusDisconnected: 'Отключен',

  // Original text: 'Connect'
  vifConnect: undefined,

  // Original text: 'Disconnect'
  vifDisconnect: undefined,

  // Original text: 'Remove'
  vifRemove: undefined,

  // Original text: "IP addresses"
  vifIpAddresses: 'IP-адреса',

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
  noSnapshots: 'Нет снимков',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Новый снимок',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Нажмите на кнопку снимка, чтобы создать его!',

  // Original text: 'Revert VM to this snapshot'
  revertSnapshot: undefined,

  // Original text: 'Remove this snapshot'
  deleteSnapshot: undefined,

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: undefined,

  // Original text: 'Export this snapshot'
  exportSnapshot: undefined,

  // Original text: "Creation date"
  snapshotDate: 'Дата создания',

  // Original text: "Name"
  snapshotName: 'Имя',

  // Original text: "Action"
  snapshotAction: 'Действие',

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: undefined,

  // Original text: "Remove all logs"
  logRemoveAll: 'Удалить все журналы',

  // Original text: "No logs so far"
  noLogs: 'Записей в журналах пока нет',

  // Original text: "Creation date"
  logDate: 'Дата создания',

  // Original text: "Name"
  logName: 'Имя',

  // Original text: "Content"
  logContent: 'Содержимое',

  // Original text: "Action"
  logAction: 'Действие',

  // Original text: "Remove"
  vmRemoveButton: 'Удаление',

  // Original text: "Convert"
  vmConvertButton: 'Конвертация',

  // Original text: "Xen settings"
  xenSettingsLabel: 'Конфигурация Xen',

  // Original text: "Guest OS"
  guestOsLabel: 'Гостнвая оперционная система',

  // Original text: "Misc"
  miscLabel: 'Разное',

  // Original text: "UUID"
  uuid: 'UUID',

  // Original text: "Virtualization mode"
  virtualizationMode: 'Режим виртуализации',

  // Original text: "CPU weight"
  cpuWeightLabel: 'Приоритезация CPU',

  // Original text: "Default ({value, number})"
  defaultCpuWeight: 'По умолчанию ({value, number})',

  // Original text: 'CPU cap'
  cpuCapLabel: undefined,

  // Original text: 'Default ({value, number})'
  defaultCpuCap: undefined,

  // Original text: "PV args"
  pvArgsLabel: undefined,

  // Original text: "Xen tools status"
  xenToolsStatus: 'Состояние XEN-утилит',

  // Original text: "{status}"
  xenToolsStatusValue: '{status}',

  // Original text: "OS name"
  osName: 'Имя оперционной системы',

  // Original text: "OS kernel"
  osKernel: 'Ядро оперционной системы',

  // Original text: "Auto power on"
  autoPowerOn: 'Автозапуск',

  // Original text: "HA"
  ha: 'Высокая доступность',

  // Original text: 'Affinity host'
  vmAffinityHost: undefined,

  // Original text: 'VGA'
  vmVga: undefined,

  // Original text: 'Video RAM'
  vmVideoram: undefined,

  // Original text: 'None'
  noAffinityHost: undefined,

  // Original text: "Original template"
  originalTemplate: 'Оригинальный шаблон',

  // Original text: "Unknown"
  unknownOsName: 'Неизвестно',

  // Original text: "Unknown"
  unknownOsKernel: 'Неизвестно',

  // Original text: "Unknown"
  unknownOriginalTemplate: 'Неизвестно',

  // Original text: "VM limits"
  vmLimitsLabel: 'Лимиты ВМ',

  // Original text: "CPU limits"
  vmCpuLimitsLabel: 'Лимиты CPU',

  // Original text: 'Topology'
  vmCpuTopology: undefined,

  // Original text: 'Default behavior'
  vmChooseCoresPerSocket: undefined,

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmSocketsWithCoresPerSocket: undefined,

  // Original text: 'Incorrect cores per socket value'
  vmCoresPerSocketIncorrectValue: undefined,

  // Original text: 'Please change the selected value to fix it.'
  vmCoresPerSocketIncorrectValueSolution: undefined,

  // Original text: "Memory limits (min/max)"
  vmMemoryLimitsLabel: 'Лимиты памяти (мин/мак)',

  // Original text: "vCPUs max:"
  vmMaxVcpus: 'Максимум vCPUs:',

  // Original text: "Memory max:"
  vmMaxRam: 'Максимум памяти:',

  // Original text: "Long click to add a name"
  vmHomeNamePlaceholder: 'Длительное нажатие для добавления имени',

  // Original text: "Long click to add a description"
  vmHomeDescriptionPlaceholder: 'Длительное нажатие для добавления описания',

  // Original text: "Click to add a name"
  vmViewNamePlaceholder: 'Нажми для добавления имени',

  // Original text: "Click to add a description"
  vmViewDescriptionPlaceholder: 'Нажми для добавления описания',

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
  poolPanel: 'Пул{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Хост{hosts, plural, one {} other {s}}',

  // Original text: "VM{vms, plural, one {} other {s}}"
  vmPanel: 'ВМ{vms, plural, one {} other {s}}',

  // Original text: "RAM Usage:"
  memoryStatePanel: 'Использование памяти',

  // Original text: "CPUs Usage"
  cpuStatePanel: 'Использование CPU',

  // Original text: "VMs Power state"
  vmStatePanel: 'Состояние питания ВМ',

  // Original text: "Pending tasks"
  taskStatePanel: 'Незавершенные задачи',

  // Original text: "Users"
  usersStatePanel: 'Пользователи',

  // Original text: "Storage state"
  srStatePanel: 'Состояние хранилища',

  // Original text: "{usage} (of {total})"
  ofUsage: undefined,

  // Original text: "No storage"
  noSrs: 'Нет хранилища',

  // Original text: "Name"
  srName: 'Имя',

  // Original text: "Pool"
  srPool: 'Пул',

  // Original text: "Host"
  srHost: 'Хост',

  // Original text: "Type"
  srFormat: 'Тип',

  // Original text: "Size"
  srSize: 'Размер',

  // Original text: "Usage"
  srUsage: 'Использется',

  // Original text: "used"
  srUsed: 'используется',

  // Original text: "free"
  srFree: 'свободно',

  // Original text: "Storage Usage"
  srUsageStatePanel: 'Использование хранилища',

  // Original text: "Top 5 SR Usage (in %)"
  srTopUsageStatePanel: '5 основных SR по использованию (в %)',

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
  weekHeatmapNoData: 'Нет данных.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Недельная тепловая карта',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Недельные диаграммы',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Синхронизировать масштаб:',

  // Original text: "Stats error"
  statsDashboardGenericErrorTitle: 'Ошибка статистики',

  // Original text: "There is no stats available for:"
  statsDashboardGenericErrorMessage: 'Нет статистики для:',

  // Original text: "No selected metric"
  noSelectedMetric: 'Метрика не выбрана',

  // Original text: "Select"
  statsDashboardSelectObjects: 'Выбор',

  // Original text: "Loading…"
  metricsLoading: 'Загрузка…',

  // Original text: "Coming soon!"
  comingSoon: 'Скоро появится',

  // Original text: "Orphaned snapshot VDIs"
  orphanedVdis: undefined,

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: undefined,

  // Original text: "No orphans"
  noOrphanedObject: undefined,

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: undefined,

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: undefined,

  // Original text: "Name"
  vmNameLabel: 'Имя',

  // Original text: "Description"
  vmNameDescription: 'Описание',

  // Original text: "Resident on"
  vmContainer: 'Живет в',

  // Original text: "Alarms"
  alarmMessage: 'Сигналы тревоги',

  // Original text: "No alarms"
  noAlarms: 'Нет сигналов',

  // Original text: "Date"
  alarmDate: 'Дата',

  // Original text: "Content"
  alarmContent: 'Содержание',

  // Original text: "Issue on"
  alarmObject: 'Оъект',

  // Original text: "Pool"
  alarmPool: 'Пул',

  // Original text: "Remove all alarms"
  alarmRemoveAll: 'Удалить все тревоги',

  // Original text: '{used}% used ({free} left)'
  spaceLeftTooltip: undefined,

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: 'Создать новую ВМ на {select}',

  // Original text: 'Create a new VM on {select1} or {select2}'
  newVmCreateNewVmOn2: undefined,

  // Original text: 'You have no permission to create a VM'
  newVmCreateNewVmNoPermission: undefined,

  // Original text: "Infos"
  newVmInfoPanel: 'Информация',

  // Original text: "Name"
  newVmNameLabel: 'Имя',

  // Original text: "Template"
  newVmTemplateLabel: 'Шаблон',

  // Original text: "Description"
  newVmDescriptionLabel: 'Описание',

  // Original text: "Performances"
  newVmPerfPanel: 'Производительность',

  // Original text: "vCPUs"
  newVmVcpusLabel: 'vCPUs',

  // Original text: "RAM"
  newVmRamLabel: 'Память',

  // Original text: 'Static memory max'
  newVmStaticMaxLabel: undefined,

  // Original text: 'Dynamic memory min'
  newVmDynamicMinLabel: undefined,

  // Original text: 'Dynamic memory max'
  newVmDynamicMaxLabel: undefined,

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Варианты установки',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Сеть',

  // Original text: 'e.g: http://httpredir.debian.org/debian'
  newVmInstallNetworkPlaceHolder: undefined,

  // Original text: "PV Args"
  newVmPvArgsLabel: 'Детали PV',

  // Original text: "PXE"
  newVmPxeLabel: 'PXE',

  // Original text: "Interfaces"
  newVmInterfacesPanel: 'Интерфейсы',

  // Original text: "MAC"
  newVmMacLabel: 'MAC',

  // Original text: "Add interface"
  newVmAddInterface: 'Добавить интерфейс',

  // Original text: "Disks"
  newVmDisksPanel: 'Диски',

  // Original text: "SR"
  newVmSrLabel: 'SR',

  // Original text: "Size"
  newVmSizeLabel: 'Размер',

  // Original text: "Add disk"
  newVmAddDisk: 'Добавить диск',

  // Original text: "Summary"
  newVmSummaryPanel: 'Суммарно',

  // Original text: "Create"
  newVmCreate: 'Создать',

  // Original text: "Reset"
  newVmReset: 'Сбросить',

  // Original text: "Select template"
  newVmSelectTemplate: 'Выбрать шаблон',

  // Original text: "SSH key"
  newVmSshKey: 'SSH-ключ',

  // Original text: "Config drive"
  newVmConfigDrive: 'Настоить диск',

  // Original text: "Custom config"
  newVmCustomConfig: 'Пользовательские настройки',

  // Original text: "Boot VM after creation"
  newVmBootAfterCreate: 'Запустить ВМ после создания',

  // Original text: "Auto-generated if empty"
  newVmMacPlaceholder: 'Создается автоматически, если оставить пустым',

  // Original text: "CPU weight"
  newVmCpuWeightLabel: 'Приоритезация CPU',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuWeight: undefined,

  // Original text: 'CPU cap'
  newVmCpuCapLabel: undefined,

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: undefined,

  // Original text: "Cloud config"
  newVmCloudConfig: 'Облачная конфигурация',

  // Original text: "Create VMs"
  newVmCreateVms: 'Создать виртуальные машины',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: 'Вы уверены, что хотите создать {nbVms, number} виртуальные машины?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Несколько ВМ:',

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
  resourceSets: 'Набор ресурсов',

  // Original text: "No resource sets."
  noResourceSets: 'Набор ресурсов не определен',

  // Original text: 'Loading resource sets'
  loadingResourceSets: undefined,

  // Original text: "Resource set name"
  resourceSetName: 'Имя набора ресурсов',

  // Original text: 'Recompute all limits'
  recomputeResourceSets: undefined,

  // Original text: "Save"
  saveResourceSet: 'Сохранить',

  // Original text: "Reset"
  resetResourceSet: 'Сбросить',

  // Original text: "Edit"
  editResourceSet: 'Изменить',

  // Original text: "Delete"
  deleteResourceSet: 'Удалить',

  // Original text: "Delete resource set"
  deleteResourceSetWarning: 'Удалить набор ресурсов',

  // Original text: "Are you sure you want to delete this resource set?"
  deleteResourceSetQuestion: 'Вы уверены, что хотите удалить этот набор ресурсов?',

  // Original text: "Missing objects:"
  resourceSetMissingObjects: 'Объект не найден:',

  // Original text: "vCPUs"
  resourceSetVcpus: 'vCPUs',

  // Original text: "Memory"
  resourceSetMemory: 'Память',

  // Original text: "Storage"
  resourceSetStorage: 'Хранилище',

  // Original text: "Unknown"
  unknownResourceSetValue: 'Неизвестно',

  // Original text: "Available hosts"
  availableHosts: 'Доступные хосты',

  // Original text: "Excluded hosts"
  excludedHosts: 'Используемые хосты',

  // Original text: "No hosts available."
  noHostsAvailable: 'Нет доступных хостов',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription:
    'Виртуальные машины, созданные из этого набора ресурсов, должны работать на следующих хостах.',

  // Original text: "Maximum CPUs"
  maxCpus: 'Максимум CPUs',

  // Original text: "Maximum RAM (GiB)"
  maxRam: 'Максимум памяти (ГиБ)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Максимум дискового пространства',

  // Original text: 'IP pool'
  ipPool: undefined,

  // Original text: 'Quantity'
  quantity: undefined,

  // Original text: "No limits."
  noResourceSetLimits: 'Нет лимитов',

  // Original text: "Total:"
  totalResource: 'Итого:',

  // Original text: "Remaining:"
  remainingResource: 'Осталось:',

  // Original text: "Used:"
  usedResource: 'Используется:',

  // Original text: 'New'
  resourceSetNew: undefined,

  // Original text: "Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files."
  importVmsList:
    'Перетащите сюда несколько файлов виртуальных машин или нажмите, чтобы выбрать виртуальные машины для загрузки. Работает только с файлами .xva/.ova.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Нет выбраных ВМ',

  // Original text: "To Pool:"
  vmImportToPool: 'В пул:',

  // Original text: "To SR:"
  vmImportToSr: 'В SR:',

  // Original text: "VM{nVms, plural, one {} other {s}} to import"
  vmsToImport: 'ВМ для импорта',

  // Original text: "Reset"
  importVmsCleanList: 'Сбросить',

  // Original text: "VM import success"
  vmImportSuccess: 'Импорт ВМ выполнен успешно',

  // Original text: "VM import failed"
  vmImportFailed: 'Ошибка импорта ВМ',

  // Original text: "Import starting…"
  startVmImport: 'Начало импорта…',

  // Original text: "Export starting…"
  startVmExport: 'Начало экспорта…',

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
  noTasks: 'Нет незаконченных задач',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'В настоящее время нет задач, ожидающих выполнения на XenServer.',

  // Original text: 'Schedules'
  backupSchedules: undefined,

  // Original text: 'Get remote'
  getRemote: undefined,

  // Original text: "List Remote"
  listRemote: 'Список удаленных резервных копий',

  // Original text: "simple"
  simpleBackup: 'простой',

  // Original text: "delta"
  delta: 'дифференциальный',

  // Original text: "Restore Backups"
  restoreBackups: 'Восстановить резервную копию',

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: undefined,

  // Original text: "Enabled"
  remoteEnabled: 'Доступно',

  // Original text: "Error"
  remoteError: 'Ошибка',

  // Original text: "No backup available"
  noBackup: 'Нет доступных резервных копий',

  // Original text: "VM Name"
  backupVmNameColumn: 'Имя ВМ',

  // Original text: 'Tags'
  backupTags: undefined,

  // Original text: "Last Backup"
  lastBackupColumn: 'Последняя резервная копия',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Доступные резервные копии',

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

  // Original text: "Import VM"
  importBackupTitle: 'Импорт ВМ',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Начинаем импорт резервной копии',

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

  // Original text: 'Shutdown host'
  stopHostModalTitle: undefined,

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage: undefined,

  // Original text: 'Add host'
  addHostModalTitle: undefined,

  // Original text: 'Are you sure you want to add {host} to {pool}?'
  addHostModalMessage: undefined,

  // Original text: 'Restart host'
  restartHostModalTitle: undefined,

  // Original text: 'This will restart your host. Do you want to continue?'
  restartHostModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}'
  restartHostsAgentsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage: undefined,

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: undefined,

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Arrancar VM{vms, plural, one {} other {s}}',

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
  startVmsModalMessage: 'Вы уверены, что хотите запустить {vms} ВМ{vms, plural, one {} other {s}}?',

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage: undefined,

  // Original text: 'Start failed'
  failedVmsErrorTitle: undefined,

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: undefined,

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Остановить ВМ{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Вы уверены, что хотите остановить {vms, number} ВМ{vms, plural, one {} other {s}}?',

  // Original text: 'Restart VM'
  restartVmModalTitle: undefined,

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: undefined,

  // Original text: 'Stop VM'
  stopVmModalTitle: undefined,

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: undefined,

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Перезапустить ВМ{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Вы уверены, что хотите перезапустить {vms, number} ВМ{vms, plural, one {} other {s}}?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Снимок ВМ{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Вы уверены, что хотите сделать сникми {vms, number} ВМ{vms, plural, one {} other {s}}?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Удалить ВМ{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Вы уверены, что хотите удалить {vms, number} ВМ{vms, plural, one {} other {s}}? ВСЕ ДИСКИ ВИРТУАЛЬНЫХ МАШИН БУДУТ УДАЛЕНЫ!',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Удалить ВМ',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage:
    'Вы уверены, что хотите удалить эту виртуальную машину? ВСЕ ДИСКИ ВИРТУАЛЬНОЙ МАШИНЫ БУДУТ УДАЛЕНЫ!',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Переместить ВМ',

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
  optionalEntry: undefined,

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
  importBackupModalTitle: 'Импортировать {name} резервную копию',

  // Original text: "Start VM after restore"
  importBackupModalStart: 'Запустить ВМ после восстановления',

  // Original text: "Select your backup…"
  importBackupModalSelectBackup: 'Выберите резервную копию…',

  // Original text: "Are you sure you want to remove all orphaned snapshot VDIs?"
  removeAllOrphanedModalWarning: 'Вы уверены, что хотите удалить все потерянные VDI?',

  // Original text: "Remove all logs"
  removeAllLogsModalTitle: 'Очистить все журналы',

  // Original text: "Are you sure you want to remove all logs?"
  removeAllLogsModalWarning: 'Вы уверены, что хотите очистить все журналы?',

  // Original text: "This operation is definitive."
  definitiveMessageModal: 'Эта операция является окончательной',

  // Original text: "Previous SR Usage"
  existingSrModalTitle: 'Предыдущее использование SR',

  // Original text: "This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingSrModalText:
    'Этот путь ранее использовался хостом XenServer в качестве хранилища. Все существующие данные будут потеряны, если вы продолжите создание SR.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Предыдущее использование LUN',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'Этот LUN ранее использовался хостом XenServer в качестве хранилища. Все существующие данные будут потеряны, если вы продолжите создание SR.',

  // Original text: "Replace current registration?"
  alreadyRegisteredModal: 'Заменить текущую запись?',

  // Original text: "Your XO appliance is already registered to {email}, do you want to forget and replace this registration ?"
  alreadyRegisteredModalText: 'Ваш XOA уже зарегистрирован в {email}, вы хотите сменить регистрацию?',

  // Original text: "Ready for trial?"
  trialReadyModal: 'Готовы к пробному периоду?',

  // Original text: "During the trial period, XOA need to have a working internet connection. This limitation does not apply for our paid plans!"
  trialReadyModalText:
    'В течение пробного периода для XOA требуется подключение к Интернету. Это ограничение не распространяется на тарифные планы',

  // Original text: 'Label'
  serverLabel: undefined,

  // Original text: "Host"
  serverHost: 'Хост',

  // Original text: "Username"
  serverUsername: 'Имя пользователя',

  // Original text: "Password"
  serverPassword: 'Пароль',

  // Original text: "Action"
  serverAction: 'Действие',

  // Original text: "Read Only"
  serverReadOnly: 'Только для чтения',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: undefined,

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: undefined,

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo: undefined,

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

  // Original text: 'Authentication error'
  serverAuthFailed: undefined,

  // Original text: 'Unknown error'
  serverUnknownError: undefined,

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: undefined,

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion: undefined,

  // Original text: "Copy VM"
  copyVm: 'Копировать ВМ',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Вы уверены, что хотите скопировать эту виртуальную машину на {SR}?',

  // Original text: "Name"
  copyVmName: 'Имя',

  // Original text: 'Name pattern'
  copyVmNamePattern: undefined,

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Если пусто: имя копируемой ВМ',

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: undefined,

  // Original text: "Select SR"
  copyVmSelectSr: 'Выберите SR',

  // Original text: "Use compression"
  copyVmCompress: 'Использовать сжатие',

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

  // Original text: "Create network"
  newNetworkCreate: 'Создать сеть',

  // Original text: 'Create bonded network'
  newBondedNetworkCreate: undefined,

  // Original text: "Interface"
  newNetworkInterface: 'Интерфейс',

  // Original text: "Name"
  newNetworkName: 'Имя',

  // Original text: "Description"
  newNetworkDescription: 'Описание',

  // Original text: "VLAN"
  newNetworkVlan: 'VLAN',

  // Original text: "No VLAN if empty"
  newNetworkDefaultVlan: 'VLAN не определён',

  // Original text: "MTU"
  newNetworkMtu: 'MTU',

  // Original text: "Default: 1500"
  newNetworkDefaultMtu: 'По умолчанию: 1500',

  // Original text: 'Name required'
  newNetworkNoNameErrorTitle: undefined,

  // Original text: 'A name is required to create a network'
  newNetworkNoNameErrorMessage: undefined,

  // Original text: 'Bond mode'
  newNetworkBondMode: undefined,

  // Original text: "Delete network"
  deleteNetwork: 'Удалить сеть',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Вы уверены что хотите удалить эту сеть?',

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
  xenOrchestraServer: 'Сервер Xen Orchestra',

  // Original text: "Xen Orchestra web client"
  xenOrchestraWeb: 'WEB-клиент Xen Orchestra',

  // Original text: "No pro support provided!"
  noProSupport: '"PRO" поддержка не предоставляется!',

  // Original text: "Use in production at your own risks"
  noProductionUse: 'Использование в производстве на свой страх и риск',

  // Original text: "You can download our turnkey appliance at {website}""
  downloadXoaFromWebsite: 'Вы можете скачать нашу сборку  Xen Orchestra с {веб-сайте}',

  // Original text: "Bug Tracker"
  bugTracker: 'Bug Tracker',

  // Original text: "Issues? Report it!"
  bugTrackerText: 'Проблема? Сообщи!',

  // Original text: "Community"
  community: 'Сообщество',

  // Original text: "Join our community forum!"
  communityText: 'Присоединяйтесь к форуму нашего сообщества!',

  // Original text: "Free Trial for Premium Edition!"
  freeTrial: 'Бесплатная пробная версия "Premium Edition"!',

  // Original text: "Request your trial now!"
  freeTrialNow: 'Зарегистрируй пробный период сейчас!',

  // Original text: "Any issue?"
  issues: 'Какая-то проблема?',

  // Original text: "Problem? Contact us!"
  issuesText: 'Проблема? Свяжитесь с нами!',

  // Original text: "Documentation"
  documentation: 'Документация',

  // Original text: "Read our official doc"
  documentationText: 'Прочитайте нашу официальную документацию',

  // Original text: "Pro support included"
  proSupportIncluded: 'Профессиональная поддержка включена',

  // Original text: "Access your XO Account"
  xoAccount: 'Доступ к вашей учетной записи XO',

  // Original text: "Report a problem"
  openTicket: 'Сообщить о проблеме',

  // Original text: "Problem? Open a ticket!"
  openTicketText: 'Проблема? Открой заявку!',

  // Original text: "Upgrade needed"
  upgradeNeeded: 'Требуется обновление',

  // Original text: "Upgrade now!"
  upgradeNow: 'Обнови сейчас',

  // Original text: "Or"
  or: 'Или',

  // Original text: "Try it for free!"
  tryIt: 'Попробуй бесплатно!',

  // Original text: "This feature is available starting from {plan} Edition"
  availableIn: 'Эта функция доступна только в {plan} Edition',

  // Original text: 'This feature is not available in your version, contact your administrator to know more.'
  notAvailable: undefined,

  // Original text: 'Updates'
  updateTitle: undefined,

  // Original text: "Registration"
  registration: 'Регистрация',

  // Original text: "Trial"
  trial: 'Пробный период',

  // Original text: "Settings"
  settings: 'Настройки',

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
  update: 'Обновить',

  // Original text: 'Refresh'
  refresh: undefined,

  // Original text: "Upgrade"
  upgrade: 'Обновить',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'Для Community Edition обновления не доступны',

  // Original text: "Please consider subscribe and try it with all features for free during 15 days on {link}.""
  considerSubscribe:
    'Пожалуйста, рассмотрите возможность подписки и попробуйте все функции бесплатно в течение 15 дней на {link}.',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning:
    'Ручные обновления можут нарушить работоспособность ПО из-за проблем с зависимостями, делайте это с осторожностью',

  // Original text: "Current version:"
  currentVersion: 'Текущая версия:',

  // Original text: "Register"
  register: 'Регистрация',

  // Original text: 'Edit registration'
  editRegistration: undefined,

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Пожалуйста, зарегистрируйтесь, чтобы испытать пробный период',

  // Original text: "Start trial"
  trialStartButton: 'Активировать пробный период',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil:
    'Вы можете использовать пробную версию до {date, date, medium}. Обновите свою установку Xen Orchestra, чтобы продолжить использовать все преимущества.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Ваш пробный период закончился. Свяжитесь с нами или вернитесь к бесплатной версии',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked:
    'Ваша служба xoa-updater, похоже, не работает. XOA не может работать должным образом без обращения к этой службе',

  // Original text: "No update information available"
  noUpdateInfo: 'Нет информации об обновлении',

  // Original text: "Update information may be available"
  waitingUpdateInfo: 'Информация об обновлении может быть доступна',

  // Original text: "Your XOA is up-to-date"
  upToDate: 'Ваш XOA обновлен до последней версии',

  // Original text: "You need to update your XOA (new version is available)"
  mustUpgrade: 'Вам необходимо обновить XOA (доступна новая версия)',

  // Original text: "Your XOA is not registered for updates"
  registerNeeded: 'Ваш XOA не зарегистрирован для получения обновлений',

  // Original text: "Can't fetch update information"
  updaterError: 'Не удалось получить информацию об обновлении',

  // Original text: 'Upgrade successful'
  promptUpgradeReloadTitle: undefined,

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?'
  promptUpgradeReloadMessage: undefined,

  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra из исходного кода',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'Вы используете XO из исходного кода! Отлично подходит для личного/некоммерческого использования',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: 'Если вы компания, лучше использовать ее с нашим устройством с включенной поддержкой Pro.',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'Если вы компания, лучше использовать ее с нашим устройством с включенной поддержкой Pro.',

  // Original text: "Connect PIF"
  connectPif: 'Подключить PIF',

  // Original text: "Are you sure you want to connect this PIF?"
  connectPifConfirm: 'Вы уверены, что хотите подключить этот PIF?',

  // Original text: "Disconnect PIF"
  disconnectPif: 'Отключить PIF',

  // Original text: "Are you sure you want to disconnect this PIF?"
  disconnectPifConfirm: 'Вы уверены, что хотите отключить этот PIF?',

  // Original text: "Delete PIF"
  deletePif: 'Удалить PIF',

  // Original text: "Are you sure you want to delete this PIF?"
  deletePifConfirm: 'Вы уверены, что хотите удалить этот PIF?',

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

  // Original text: 'Click to enable'
  logIndicationToEnable: undefined,

  // Original text: 'Click to disable'
  logIndicationToDisable: undefined,

  // Original text: 'Report a bug'
  reportBug: undefined,

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
  shortcut_GO_TO_HOSTS: undefined,

  // Original text: 'Go to pools list'
  shortcut_GO_TO_POOLS: undefined,

  // Original text: 'Go to VMs list'
  shortcut_GO_TO_VMS: undefined,

  // Original text: 'Go to SRs list'
  shortcut_GO_TO_SRS: undefined,

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

  // Original text: 'Name'
  xosanName: undefined,

  // Original text: 'Host'
  xosanHost: undefined,

  // Original text: 'Hosts'
  xosanHosts: undefined,

  // Original text: 'Volume ID'
  xosanVolumeId: undefined,

  // Original text: 'Size'
  xosanSize: undefined,

  // Original text: 'Used space'
  xosanUsedSpace: undefined,

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

  // Original text: 'Installing XOSAN. Please wait…'
  xosanInstalling: undefined,

  // Original text: 'No XOSAN available for Community Edition'
  xosanCommunity: undefined,

  // Original text: 'Install cloud plugin first'
  xosanInstallCloudPlugin: undefined,

  // Original text: 'Load cloud plugin first'
  xosanLoadCloudPlugin: undefined,

  // Original text: 'Loading…'
  xosanLoading: undefined,

  // Original text: 'XOSAN is not available at the moment'
  xosanNotAvailable: undefined,

  // Original text: 'Register for the XOSAN beta'
  xosanRegisterBeta: undefined,

  // Original text: 'You have successfully registered for the XOSAN beta. Please wait until your request has been approved.'
  xosanSuccessfullyRegistered: undefined,

  // Original text: 'Install XOSAN pack on these hosts:'
  xosanInstallPackOnHosts: undefined,

  // Original text: 'Install {pack} v{version}?'
  xosanInstallPack: undefined,

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: undefined,

  // Original text: 'At least one of these version requirements must be satisfied by all the hosts in this pool:'
  xosanPackRequirements: undefined,
}
