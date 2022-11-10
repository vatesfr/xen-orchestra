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
  pillMaster: 'Мастер',

  // Original text: "Home"
  homePage: 'Главная',

  // Original text: 'VMs'
  homeVmPage: 'Вируальные машины',

  // Original text: 'Hosts'
  homeHostPage: 'Узлы',

  // Original text: 'Pools'
  homePoolPage: 'Пулы',

  // Original text: 'Templates'
  homeTemplatePage: 'Шаблоны',

  // Original text: 'Storages'
  homeSrPage: "Хранилища",

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
  aboutXoaPlan: "О Xen Orchestra {xoaPlan}",

  // Original text: "New"
  newMenu: 'Добавить',

  // Original text: "Tasks"
  taskMenu: 'Задачи',

  // Original text: 'Tasks'
  taskPage: 'Задачи',

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
  backupRemotesPage: 'Дистанционные',

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
  homeWelcomeText: 'Добавьте свои Узлы и пулы XCP-ng',

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
  homeRestoreBackupMessage: 'Восстановить резервную копию из дистанционного хранилища',

  // Original text: "This will create a new VM"
  homeNewVmMessage: 'Это создаст новую виртуальную машину',

  // Original text: "Filters"
  homeFilters: 'Фильтры',

  // Original text: 'No results! Click here to reset your filters'
  homeNoMatches: 'Ничего не найдено! Нажмите здась что бы сбросить фильтры',

  // Original text: "Pool"
  homeTypePool: 'Пул',

  // Original text: "Host"
  homeTypeHost: 'Узел',

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
  homeAllHosts: 'Узлы',

  // Original text: "Tags"
  homeAllTags: 'Тэги',

  // Original text: "New VM"
  homeNewVm: 'Новая ВМ',

  // Original text: 'None'
  homeFilterNone: 'Не определено',

  // Original text: "Running hosts"
  homeFilterRunningHosts: 'Работающие Узлы',

  // Original text: "Disabled hosts"
  homeFilterDisabledHosts: 'Отключенные Узлы',

  // Original text: "Running VMs"
  homeFilterRunningVms: 'Работающие ВМ',

  // Original text: "Non running VMs"
  homeFilterNonRunningVms: 'Выключенные ВМ',

  // Original text: "Pending VMs"
  homeFilterPendingVms: 'Ожидание ВМ',

  // Original text: "HVM guests"
  homeFilterHvmGuests: 'ВМ с HVM',

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

  // Original text: "Disks usage"
  sortByDisksUsage: 'Использованию диска',

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
  homeMissingPatches: 'Обновлений нет',

  // Original text: 'Master:'
  homePoolMaster: 'Мастер',

  // Original text: 'Resource set: {resourceSet}'
  homeResourceSet: 'Набор ресурсов',

  // Original text: 'High Availability'
  highAvailability: 'Высокая доступность',

  // Original text: 'Shared {type}'
  srSharedType: "Совместное использование {type}",

  // Original text: 'Not shared {type}'
  srNotSharedType: "Без совместного использования {type}",

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
  selectHosts: 'Выберите Узел(ы)…',

  // Original text: "Select object(s)…"
  selectHostsVms: 'Выберите объект(ы)…',

  // Original text: "Select Network(s)…"
  selectNetworks: 'Выберите сеть/сети…',

  // Original text: "Select PIF(s)…"
  selectPifs: 'Выберите физический(ие) сетевой(вые) интерфейс(ы)…',

  // Original text: "Select Pool(s)…"
  selectPools: 'Выберите Пул(ы)…',

  // Original text: "Select Remote(s)…"
  selectRemotes: 'Выберите дистанционное(ые) хранилище(я)…',

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
  timezonePickerUseLocalTime: "Часовой пояс WEB-браузера",

  // Original text: 'Server timezone ({value})'
  serverTimezoneOption: "Часовой пояс сервера ({value})",

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
  localRemoteWarningTitle: 'Выбран локально-дистанционный',

  // Original text: 'Warning: local remotes will use limited XOA disk space. Only for advanced users.'
  localRemoteWarningMessage: 'Предупреждение: локально-дистанционные устройства будут использовать ограниченное дисковое пространство XOA. Только для продвинутых пользователей.',

  // Original text: 'Warning: this feature works only with XenServer 6.5 or newer.'
  backupVersionWarning: 'Предупреждение: эта функция работает только с XenServer 6.5 или новее.',

  // Original text: 'VMs'
  editBackupVmsTitle: 'ВМ',

  // Original text: 'VMs statuses'
  editBackupSmartStatusTitle: 'Статусы ВМ',

  // Original text: 'Resident on'
  editBackupSmartResidentOn: 'Работает на',

  // Original text: 'Pools'
  editBackupSmartPools: 'Пулы',

  // Original text: 'Tags'
  editBackupSmartTags: 'Тэги',

  // Original text: 'VMs Tags'
  editBackupSmartTagsTitle: 'Тэги ВМ',

  // Original text: 'Reverse'
  editBackupNot: 'Вернуть назад',

  // Original text: 'Tag'
  editBackupTagTitle: 'Тэг',

  // Original text: 'Report'
  editBackupReportTitle: 'Отчет',

  // Original text: 'Automatically run as scheduled'
  editBackupScheduleEnabled: 'Автозапуск по расписанию',

  // Original text: 'Depth'
  editBackupDepthTitle: 'Глубина',

  // Original text: 'Remote'
  editBackupRemoteTitle: 'Дистанционный',

  // Original text: 'Delete the old backups first'
  deleteOldBackupsFirst: 'Сначала удалите старые резервные копии',

  // Original text: "Remote stores for backup"
  remoteList: 'Дистанционное хранилище для резервного копирования',

  // Original text: "New File System Remote"
  newRemote: 'Новая дистанционная файловая система',

  // Original text: "Local"
  remoteTypeLocal: 'Локально',

  // Original text: "NFS"
  remoteTypeNfs: 'NFS',

  // Original text: "SMB"
  remoteTypeSmb: 'SMB',

  // Original text: "Type"
  remoteType: 'Тип',

  // Original text: 'Test your remote'
  remoteTestTip: 'Проверьте дистанционный источник',

  // Original text: 'Test Remote'
  testRemote: 'Проверьте дистанционный источник',

  // Original text: 'Test failed for {name}'
  remoteTestFailure: 'Тест не пройден для {name}',

  // Original text: 'Test passed for {name}'
  remoteTestSuccess: 'Тест пройден успешно для {name}',

  // Original text: 'Error'
  remoteTestError: 'Ошибка',

  // Original text: 'Test Step'
  remoteTestStep: 'Этап теста',

  // Original text: 'Test file'
  remoteTestFile: 'Файл теста',

  // Original text: 'Test name'
  remoteTestName: 'Имя теста',

  // Original text: 'Remote name already exists!'
  remoteTestNameFailure: 'Имя уже используется!',

  // Original text: 'The remote appears to work correctly'
  remoteTestSuccessMessage: 'Дистанционное устройство работает корректно',

  // Original text: 'Connection failed'
  remoteConnectionFailed: 'Ошибка подключения',

  // Original text: 'Name'
  remoteName: 'Имя',

  // Original text: 'Path'
  remotePath: 'Путь',

  // Original text: 'State'
  remoteState: 'Состояние',

  // Original text: 'Device'
  remoteDevice: 'Устройство',

  // Original text: 'Share'
  remoteShare: 'Общий доступ',

  // Original text: 'Action'
  remoteAction: 'Действие',

  // Original text: 'Auth'
  remoteAuth: 'Авторизация',

  // Original text: 'Mounted'
  remoteMounted: 'Примонтирован',

  // Original text: 'Unmounted'
  remoteUnmounted: 'Отмонтирован',

  // Original text: 'Connect'
  remoteConnectTip: 'Подключить',

  // Original text: 'Disconnect'
  remoteDisconnectTip: 'Отключить',

  // Original text: 'Connected'
  remoteConnected: 'Подключен',

  // Original text: 'Disconnected'
  remoteDisconnected: 'Отключен',

  // Original text: 'Delete'
  remoteDeleteTip: 'Удалить',

  // Original text: 'remote name *'
  remoteNamePlaceHolder: 'Имя дистанционного устройства *',

  // Original text: 'Name *'
  remoteMyNamePlaceHolder: 'Имя *',

  // Original text: '/path/to/backup'
  remoteLocalPlaceHolderPath: '/путь/к/резервной/копии',

  // Original text: 'host *'
  remoteNfsPlaceHolderHost: 'Узел *',

  // Original text: 'path/to/backup'
  remoteNfsPlaceHolderPath: '/путь/к/резервной/копии',

  // Original text: 'subfolder [path\\to\\backup]'
  remoteSmbPlaceHolderRemotePath: '[путь\\к\\резервной\\копии]',

  // Original text: 'Username'
  remoteSmbPlaceHolderUsername: 'Имя пользователя',

  // Original text: 'Password'
  remoteSmbPlaceHolderPassword: 'Пароль',

  // Original text: 'Domain'
  remoteSmbPlaceHolderDomain: 'Домен',

  // Original text: '<address>\\<share> *'
  remoteSmbPlaceHolderAddressShare: undefined,

  // Original text: 'password(fill to edit)'
  remotePlaceHolderPassword: 'Пароль(нажми для изменения)',

  // Original text: 'Create a new SR'
  newSrTitle: 'Создать новый SR',

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
  newSrHost: 'Узел',

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
  newSrNamePlaceHolder: 'Имя хранилища',

  // Original text: 'Storage description'
  newSrDescPlaceHolder: 'Описание хранилища',

  // Original text: 'Address'
  newSrAddressPlaceHolder: 'Адрес',

  // Original text: '[port]'
  newSrPortPlaceHolder: undefined,

  // Original text: 'Username'
  newSrUsernamePlaceHolder: 'Имя пользователя',

  // Original text: 'Password'
  newSrPasswordPlaceHolder: 'Пароль',

  // Original text: 'Device, e.g /dev/sda…'
  newSrLvmDevicePlaceHolder: 'Устройство, например /dev/sda…',

  // Original text: '/path/to/directory'
  newSrLocalPathPlaceHolder: '/путь/к/директории',

  // Original text: "Users/Groups"
  subjectName: 'Пользователи/Группы',

  // Original text: "Object"
  objectName: 'Обьект',

  // Original text: 'No acls found'
  aclNoneFound: 'ACL-списков не найдено',

  // Original text: "Role"
  roleName: 'Роль',

  // Original text: 'Create'
  aclCreate: 'Создать',

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
  noUser: 'нет пользователя',

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
  countUsers: '{users, number} пользовател{users, plural, one {ь} other {я}}',

  // Original text: "Select Permission"
  selectPermission: 'Укажите разрешения',

  // Original text: 'No plugins found'
  noPlugins: 'Плагины не найдены',

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
  purgePluginConfiguration: 'Сбросить конфигурацию плагина',

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
  pluginConfigurationPresetTitle: 'Предопределенная конфигурация',

  // Original text: 'Choose a predefined configuration.'
  pluginConfigurationChoosePreset: 'Выберите предопределенную конфигурацию.',

  // Original text: 'Apply'
  applyPluginPreset: 'Принять',

  // Original text: 'Save filter error'
  saveNewUserFilterErrorTitle: 'Ошибка сохранения фильтра',

  // Original text: 'Bad parameter: name must be given.'
  saveNewUserFilterErrorBody: 'Не верный параметр: имя должно быть указано.',

  // Original text: 'Name:'
  filterName: 'Имя:',

  // Original text: 'Value:'
  filterValue: 'Значение:',

  // Original text: 'Save new filter'
  saveNewFilterTitle: 'Сохранить новый фильр',

  // Original text: 'Set custom filters'
  setUserFiltersTitle: 'Установить пользовательские фильтры',

  // Original text: 'Are you sure you want to set custom filters?'
  setUserFiltersBody: 'Вы уверены, что хотите установить пользовательские фильтры?',

  // Original text: 'Remove custom filter'
  removeUserFilterTitle: 'Убрать пользовательские фильтры',

  // Original text: 'Are you sure you want to remove custom filter?'
  removeUserFilterBody: 'Вы уверены, что хотите убрать пользовательские фильтры?',

  // Original text: 'Default filter'
  defaultFilter: 'Фильр по умолчанию',

  // Original text: 'Default filters'
  defaultFilters: 'Фильтры по умолчанию',

  // Original text: 'Custom filters'
  customFilters: 'Пользовательский фильр',

  // Original text: 'Customize filters'
  customizeFilters: 'Настроить фильтры',

  // Original text: 'Save custom filters'
  saveCustomFilters: 'Сохранить изменения фильтров',

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
  srReconnectAll: 'Подключить ко всем Узлам',

  // Original text: "Disconnect from all hosts"
  srDisconnectAll: 'Отключить от всех Узлов',

  // Original text: "Forget this SR"
  srForget: 'Забыть этот SR',

  // Original text: 'Forget SRs'
  srsForget: 'Забыть этот SRs',

  // Original text: "Remove this SR"
  srRemoveButton: 'Удалить этот SR',

  // Original text: "No VDIs in this storage"
  srNoVdis: 'На этом хранилище нет VDI',

  // Original text: 'Pool RAM usage:'
  poolTitleRamUsage: 'Использование памяти пулом:',

  // Original text: '{used} used on {total}'
  poolRamUsage: '{used} используется на {total}',

  // Original text: 'Master:'
  poolMaster: 'Мастер',

  // Original text: 'Display all hosts of this pool'
  displayAllHosts: 'Отобразить все Узлы в этом пуле',

  // Original text: 'Display all storages of this pool'
  displayAllStorages: 'Отобразить все хранилища в этом пуле',

  // Original text: 'Display all VMs of this pool'
  displayAllVMs: 'Отобразить все виртуальные машины в этом пуле',

  // Original text: "Hosts"
  hostsTabName: 'Узлы',

  // Original text: 'Vms'
  vmsTabName: 'ВМ',

  // Original text: 'Srs'
  srsTabName: 'SRs',

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
  noHost: 'Нет Узлов',

  // Original text: '{used}% used ({free} free)'
  memoryLeftTooltip: '{used}% используется ({free} свободно)',

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
  showPifs: 'Показать PIFs',

  // Original text: 'Hide PIFs'
  hidePifs: 'Скрыть PIFs',

  // Original text: 'Show details'
  showDetails: 'Показать детализацию',

  // Original text: 'Hide details'
  hideDetails: 'Скрыть детализацию',

  // Original text: 'No stats'
  poolNoStats: 'Нет статистики',

  // Original text: 'All hosts'
  poolAllHosts: 'Все Узлы',

  // Original text: "Add SR"
  addSrLabel: 'Добавить SR',

  // Original text: "Add VM"
  addVmLabel: 'Добавить ВМ',

  // Original text: "Add Host"
  addHostLabel: 'Добавить Узел',

  // Original text: 'This host needs to install {patches, number} patch{patches, plural, one {} other {es}} before it can be added to the pool. This operation may be long.'
  hostNeedsPatchUpdate: 'Этот Узел требует установки {patches, number} обновлени{patches, plural, one {я} other {й}} прежде чем его можно будет добавить в пул. Эта операция может быть длительной.',

  // Original text: "This host cannot be added to the pool because it's missing some patches."
  hostNeedsPatchUpdateNoInstall: 'Этот Узел не может быть добавлен в пул, так как на нем отсутствуют некоторые обновления.',

  // Original text: 'Adding host failed'
  addHostErrorTitle: 'Не удалось добавить Узел',

  // Original text: 'Host patches could not be homogenized.'
  addHostNotHomogeneousErrorMessage: 'Обновления Узла не могут быть приведены к единообразию.',

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
  noHostsAvailableErrorTitle: 'Ошибка при перезагрузке Узла',

  // Original text: 'Some VMs cannot be migrated before restarting this host. Please try force reboot.'
  noHostsAvailableErrorMessage: 'Некоторые виртуальные машины нельзя перенести до перезапуска этого Узла. Попробуйте принудительную перезагрузку.',

  // Original text: 'Error while restarting hosts'
  failHostBulkRestartTitle: 'Ошибка при перезагрузке Узлов',

  // Original text: '{failedHosts, number}/{totalHosts, number} host{failedHosts, plural, one {} other {s}} could not be restarted.'
  failHostBulkRestartMessage: '{failedHosts, number}/{totalHosts, number} Уз{failedHosts, plural, one {ел не может быть перезагружен} other {ла не могут быть перезагружны}} .',

  // Original text: 'Reboot to apply updates'
  rebootUpdateHostLabel: 'Перезагрузитесь для применения обновлений',

  // Original text: "Emergency mode"
  emergencyModeLabel: 'Режим восстановления',

  // Original text: "Storage"
  storageTabName: 'Хранилище',

  // Original text: "Patches"
  patchesTabName: 'Обновления',

  // Original text: "Load average"
  statLoad: 'Средняя нагрузка',

  // Original text: 'RAM Usage: {memoryUsed}'
  memoryHostState: 'Использование памяти: {memoryUsed}',

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
  hostStartedSince: 'Время работы Узла',

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
  supplementalPacks: 'Установлены дополнительные пакеты',

  // Original text: 'Install new supplemental pack'
  supplementalPackNew: 'Установить новые дополнительные пакеты',

  // Original text: 'Install supplemental pack on every host'
  supplementalPackPoolNew: 'Установить дополнительные пакеты на все Узлы',

  // Original text: '{name} (by {author})'
  supplementalPackTitle: '{name} (от {author})',

  // Original text: 'Installation started'
  supplementalPackInstallStartedTitle: 'Установка запущена',

  // Original text: 'Installing new supplemental pack…'
  supplementalPackInstallStartedMessage: 'Установка новых дополнительных пакетов...',

  // Original text: 'Installation error'
  supplementalPackInstallErrorTitle: 'Ошибка установки',

  // Original text: 'The installation of the supplemental pack failed.'
  supplementalPackInstallErrorMessage: 'Не удалось установить дополнительный пакет.',

  // Original text: 'Installation success'
  supplementalPackInstallSuccessTitle: 'Установка успешно завершена',

  // Original text: 'Supplemental pack successfully installed.'
  supplementalPackInstallSuccessMessage: 'Установка дополнительного пакета успешно завершена',

  // Original text: "Add a network"
  networkCreateButton: 'Добавить сеть',

  // Original text: 'Add a bonded network'
  networkCreateBondedButton: 'Добавить связанную сеть',

  // Original text: "Device"
  pifDeviceLabel: 'Устройство',

  // Original text: "Network"
  pifNetworkLabel: 'Сеть',

  // Original text: "VLAN"
  pifVlanLabel: 'VLAN',

  // Original text: "Address"
  pifAddressLabel: 'Адрес',

  // Original text: 'Mode'
  pifModeLabel: 'Режим',

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
  pifInUse: 'Этот интерфейс уже используется',

  // Original text: 'Action'
  pifAction: 'Дествие',

  // Original text: 'Default locking mode'
  defaultLockingMode: 'Режим блокировки по умолчанию',

  // Original text: 'Configure IP address'
  pifConfigureIp: 'Конфигурация IP-адресов',

  // Original text: 'Invalid parameters'
  configIpErrorTitle: 'Недопустимый параметр',

  // Original text: 'IP address and netmask required'
  configIpErrorMessage: 'Укажите IP-адрес и маску сети',

  // Original text: 'Static IP address'
  staticIp: 'Статический IP-адрес',

  // Original text: 'Netmask'
  netmask: 'Маска',

  // Original text: 'DNS'
  dns: undefined,

  // Original text: 'Gateway'
  gateway: 'Шлюз по умолчанию',

  // Original text: "Add a storage"
  addSrDeviceButton: 'Добавить хранилище',

  // Original text: "Name"
  srNameLabel: 'Имя',

  // Original text: "Type"
  srType: 'Тип',

  // Original text: 'Action'
  pbdAction: 'Действие',

  // Original text: "Status"
  pbdStatus: 'Статус',

  // Original text: "Connected"
  pbdStatusConnected: 'Подключен',

  // Original text: "Disconnected"
  pbdStatusDisconnected: 'Отключен',

  // Original text: 'Connect'
  pbdConnect: 'Подключить',

  // Original text: 'Disconnect'
  pbdDisconnect: 'Отключить',

  // Original text: 'Forget'
  pbdForget: 'Забыть',

  // Original text: "Shared"
  srShared: 'С общим доступом',

  // Original text: "Not shared"
  srNotShared: 'Без общего доступа',

  // Original text: "No storage detected"
  pbdNoSr: 'Хранилище не обнаружено',

  // Original text: "Name"
  patchNameLabel: 'Имя',

  // Original text: "Install all patches"
  patchUpdateButton: 'Установить все обновления',

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
  patchStatusNotApplied: 'Отсутствующие обновления',

  // Original text: "No patch detected"
  patchNothing: 'Обновления не найдены',

  // Original text: "Release date"
  patchReleaseDate: 'Дата релиза',

  // Original text: "Guidance"
  patchGuidance: 'Руководство',

  // Original text: "Action"
  patchAction: 'Дествие',

  // Original text: 'Applied patches'
  hostAppliedPatches: 'Применить обновления',

  // Original text: "Missing patches"
  hostMissingPatches: 'Обновления не найдены',

  // Original text: "Host up-to-date!"
  hostUpToDate: 'Узел в актуальном состоянии!',

  // Original text: 'Non-recommended patch install'
  installPatchWarningTitle: 'Установка этого обновления не рекомендуется',

  // Original text: 'This will install a patch only on this host. This is NOT the recommended way: please go into the Pool patch view and follow instructions there. If you are sure about this, you can continue anyway'
  installPatchWarningContent: 'Это действие установит обновление только на этот Узел. Этот метод не рекомендуется: пожалуйста, перейдите в обновление пула и следуйте инструкциям. Если вы уверены в своих действиях, вы можете продолжить свои действия',

  // Original text: 'Go to pool'
  installPatchWarningReject: 'Перейти в пул',

  // Original text: 'Install'
  installPatchWarningResolve: 'Установить',

  // Original text: 'Refresh patches'
  refreshPatches: 'Обновить список обновлений',

  // Original text: 'Install pool patches'
  installPoolPatches: 'Установить обновления для пула',

  // Original text: 'Default SR'
  defaultSr: 'SR по умолчанию',

  // Original text: 'Set as default SR'
  setAsDefaultSr: 'Установить этот SR по умолчанию',

  // Original text: "General"
  generalTabName: 'Общее',

  // Original text: "Stats"
  statsTabName: 'Статистика',

  // Original text: "Console"
  consoleTabName: 'Консоль',

  // Original text: 'Container'
  containersTabName: 'Контейнер',

  // Original text: "Snapshots"
  snapshotsTabName: 'Снимки',

  // Original text: "Logs"
  logsTabName: 'Журналы',

  // Original text: "Advanced"
  advancedTabName: 'Дополнительно',

  // Original text: "Network"
  networkTabName: 'Сеть',

  // Original text: "Disk{disks, plural, one {} other {s}}"
  disksTabName: 'Диск{disks, plural, one {} other {и}}',

  // Original text: 'Power state'
  powerState: 'Состояние',

  // Original text: "halted"
  powerStateHalted: 'остановлен',

  // Original text: "running"
  powerStateRunning: 'работает',

  // Original text: "suspended"
  powerStateSuspended: 'приостановлен',
  
  // Original text: 'Paused' 
  powerStatePaused: 'пауза',
  
  // Original text: 'Disabled'
  powerStateDisabled: 'отключен',
  
  // Original text: 'Busy'
  powerStateBusy: 'занят',
  
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
  vmHaltedSince: 'Остановлен {ago}',

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
  useStackedValuesOnStats: 'Значения с накоплением',

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
  hideHeaderTooltip: 'Скрыть информацию',

  // Original text: 'Show infos'
  showHeaderTooltip: 'Показать информацию',

  // Original text: 'Name'
  containerName: 'Имя',

  // Original text: 'Command'
  containerCommand: 'Команда',

  // Original text: 'Creation date'
  containerCreated: 'Дата создания',

  // Original text: 'Status'
  containerStatus: 'Статус',

  // Original text: 'Action'
  containerAction: 'Действие',

  // Original text: 'No existing containers'
  noContainers: 'Нет используемых контейнеров',

  // Original text: 'Stop this container'
  containerStop: 'Остановить этот контейнер',

  // Original text: 'Start this container'
  containerStart: 'Запустить этот контейнер',

  // Original text: 'Pause this container'
  containerPause: 'Приостановить работу этого контейнера',

  // Original text: 'Resume this container'
  containerResume: 'Возобносить работу этого контейнера',

  // Original text: 'Restart this container'
  containerRestart: 'Перезапустить этот контейнер',

  // Original text: "Action"
  vdiAction: 'Действие',

  // Original text: "Attach disk"
  vdiAttachDevice: 'Подключить диск',

  // Original text: "New disk"
  vbdCreateDeviceButton: 'Новый диск',

  // Original text: "Boot order"
  vdiBootOrder: 'Очередность загрузки',

  // Original text: "Name"
  vdiNameLabel: 'Имя',

  // Original text: "Description"
  vdiNameDescription: 'Описание',

  // Original text: 'Pool'
  vdiPool: 'Пул',

  // Original text: 'Disconnect'
  vdiDisconnect: 'Отключен',

  // Original text: "Tags"
  vdiTags: 'Тэги',

  // Original text: "Size"
  vdiSize: 'Размер',

  // Original text: "SR"
  vdiSr: 'SR',

  // Original text: 'VM'
  vdiVm: 'ВМ',

  // Original text: 'Migrate VDI'
  vdiMigrate: 'Переместить VDI',

  // Original text: 'Destination SR:'
  vdiMigrateSelectSr: 'Целевой SR:',

  // Original text: 'No SR'
  vdiMigrateNoSr: 'Нет SR',

  // Original text: 'A target SR is required to migrate a VDI'
  vdiMigrateNoSrMessage: 'Укажите SR для перемещения VDI',

  // Original text: 'Forget'
  vdiForget: 'Забыть',

  // Original text: 'Remove VDI'
  vdiRemove: 'Удалить VDI',

  // Original text: 'No VDIs attached to Control Domain'
  noControlDomainVdis: 'Нет VDI, подключенных к контроллеру домена',

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
  vbdConnect: 'Подключить VBD',

  // Original text: 'Disconnect VBD'
  vbdDisconnect: 'Отключить VBD',

  // Original text: 'Bootable'
  vbdBootable: 'Загрузочный',

  // Original text: 'Readonly'
  vbdReadonly: 'Только для чтения',

  // Original text: 'Action'
  vbdAction: 'Действие',

  // Original text: 'Create'
  vbdCreate: 'Создать',

  // Original text: 'Disk name'
  vbdNamePlaceHolder: 'Имя диска',

  // Original text: 'Size'
  vbdSizePlaceHolder: 'Размер',

  // Original text: 'CD drive not completely installed'
  cdDriveNotInstalled: 'CD-привод установлен',

  // Original text: 'Stop and start the VM to install the CD drive'
  cdDriveInstallation: 'Остановите и запустите виртуальную машину, чтобы добавить CD-привод.',

  // Original text: 'Save'
  saveBootOption: 'Сохранить',

  // Original text: 'Reset'
  resetBootOption: 'Сбросить',

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
  vifConnect: 'Подключить',

  // Original text: 'Disconnect'
  vifDisconnect: 'Отключить',

  // Original text: 'Remove'
  vifRemove: 'Удалить',

  // Original text: "IP addresses"
  vifIpAddresses: 'IP-адреса',

  // Original text: 'Auto-generated if empty'
  vifMacAutoGenerate: 'Создаться автоматически, если оставить пустым',

  // Original text: 'Allowed IPs'
  vifAllowedIps: 'Разрешенные IP-адреса',

  // Original text: 'No IPs'
  vifNoIps: 'Нет IP-адресов',

  // Original text: 'Network locked'
  vifLockedNetwork: 'Сеть заблокирована',

  // Original text: 'Network locked and no IPs are allowed for this interface'
  vifLockedNetworkNoIps: 'Сеть заблокирована, и для этого интерфейса не разрешены никакие IP-адреса',

  // Original text: 'Network not locked'
  vifUnLockedNetwork: 'Сеть доступна',

  // Original text: 'Unknown network'
  vifUnknownNetwork: 'Неизвестная сеть',

  // Original text: 'Action'
  vifAction: 'Действие',

  // Original text: 'Create'
  vifCreate: 'Создать',

  // Original text: "No snapshots"
  noSnapshots: 'Нет снимков',

  // Original text: "New snapshot"
  snapshotCreateButton: 'Новый снимок',

  // Original text: "Just click on the snapshot button to create one!"
  tipCreateSnapshotLabel: 'Нажмите на кнопку снимка, чтобы создать его!',

  // Original text: 'Revert VM to this snapshot'
  revertSnapshot: 'Вернуть ВМ к этому снимку',

  // Original text: 'Remove this snapshot'
  deleteSnapshot: 'Удалить этот снимок',

  // Original text: 'Create a VM from this snapshot'
  copySnapshot: 'Сеть заблокирована',

  // Original text: 'Export this snapshot'
  exportSnapshot: 'Сеть заблокирована',

  // Original text: "Creation date"
  snapshotDate: 'Дата создания',

  // Original text: "Name"
  snapshotName: 'Имя',

  // Original text: "Action"
  snapshotAction: 'Действие',

  // Original text: 'Quiesced snapshot'
  snapshotQuiesce: 'Приостановить снимок',

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
  cpuCapLabel: 'Ограничение CPU',

  // Original text: 'Default ({value, number})'
  defaultCpuCap: 'По умолчанию ({value, number})',

  // Original text: "PV args"
  pvArgsLabel: "Параметры PV",

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
  vmVideoram: 'Видео память',

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
  vmCpuTopology: 'Топология',

  // Original text: 'Default behavior'
  vmChooseCoresPerSocket: 'Распределение по умолчанию',

  // Original text: '{nSockets, number} socket{nSockets, plural, one {} other {s}} with {nCores, number} core{nCores, plural, one {} other {s}} per socket'
  vmSocketsWithCoresPerSocket: '{nSockets, number} сокет{nSockets, plural, one {} other {а}} по {nCores, number} яд{nCores, plural, one {ра} other {ер}} на сокет',

  // Original text: 'Incorrect cores per socket value'
  vmCoresPerSocketIncorrectValue: 'Недопустимое значение ядер на сокет',

  // Original text: 'Please change the selected value to fix it.'
  vmCoresPerSocketIncorrectValueSolution: 'Пожалуйста измените выбранное значение.',

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
  templateHomeNamePlaceholder: 'Нажмите для добавления имени',

  // Original text: 'Click to add a description'
  templateHomeDescriptionPlaceholder: 'Нажмите для добавления описания',

  // Original text: 'Delete template'
  templateDelete: 'Удалить шаблон',

  // Original text: 'Delete VM template{templates, plural, one {} other {s}}'
  templateDeleteModalTitle: 'Удалить шаблон ВМ',

  // Original text: 'Are you sure you want to delete {templates, plural, one {this} other {these}} template{templates, plural, one {} other {s}}?'
  templateDeleteModalBody: 'Вы уверены что хотите удалить шаблон ВМ?',

  // Original text: "Pool{pools, plural, one {} other {s}}"
  poolPanel: 'Пул{pools, plural, one {} other {s}}',

  // Original text: "Host{hosts, plural, one {} other {s}}"
  hostPanel: 'Узел{hosts, plural, one {} other {s}}',

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
  ofUsage: '{usage} (из {total})',

  // Original text: "No storage"
  noSrs: 'Нет хранилища',

  // Original text: "Name"
  srName: 'Имя',

  // Original text: "Pool"
  srPool: 'Пул',

  // Original text: "Host"
  srHost: 'Узел',

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
  vmsStates: '{running, number} запущено ({halted, number} остановлено)',

  // Original text: 'Clear selection'
  dashboardStatsButtonRemoveAll: 'Очистить выбор',

  // Original text: 'Add all hosts'
  dashboardStatsButtonAddAllHost: 'Добавить все Узлы',

  // Original text: 'Add all VMs'
  dashboardStatsButtonAddAllVM: 'Добавить все ВМ',

  // Original text: "{value} {date, date, medium}"
  weekHeatmapData: '{value} {date, date, medium}',

  // Original text: "No data."
  weekHeatmapNoData: 'Нет данных.',

  // Original text: "Weekly Heatmap"
  weeklyHeatmap: 'Недельная тепловая карта',

  // Original text: "Weekly Charts"
  weeklyCharts: 'Недельные диаграммы',

  // Original text: "Synchronize scale:"
  weeklyChartsScaleInfo: 'Синхронизировать маштаб:',

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
  orphanedVdis: 'Осиротевшие снимки VDI',

  // Original text: "Orphaned VMs snapshot"
  orphanedVms: 'Осиротевшие снимки ВМ',

  // Original text: "No orphans"
  noOrphanedObject: 'Сирот нет',

  // Original text: "Remove all orphaned snapshot VDIs"
  removeAllOrphanedObject: 'Удалить все осиротевшие снимки VDI',

  // Original text: 'VDIs attached to Control Domain'
  vdisOnControlDomain: 'VDI, подключение к контроллеру домена',

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
  spaceLeftTooltip: '{used}% используется ({free} осталось)',

  // Original text: "Create a new VM on {select}"
  newVmCreateNewVmOn: 'Создать новую ВМ на {select}',

  // Original text: 'Create a new VM on {select1} or {select2}'
  newVmCreateNewVmOn2: 'Создать новую ВМ на {select1} или {select2}',

  // Original text: 'You have no permission to create a VM'
  newVmCreateNewVmNoPermission: 'У вас нет разрешения на создание ВМ',

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
  newVmStaticMaxLabel: 'Максимальный размер статической памяти',

  // Original text: 'Dynamic memory min'
  newVmDynamicMinLabel: 'Минимальный размер динамической памяти',

  // Original text: 'Dynamic memory max'
  newVmDynamicMaxLabel: 'Максимальный размер динамической памяти',

  // Original text: "Install settings"
  newVmInstallSettingsPanel: 'Варианты установки',

  // Original text: "ISO/DVD"
  newVmIsoDvdLabel: 'ISO/DVD',

  // Original text: "Network"
  newVmNetworkLabel: 'Сеть',

  // Original text: 'e.g: http://ftp.debian.org/debian'
  newVmInstallNetworkPlaceHolder: 'например: http://ftp.debian.org/debian',

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
  newVmDefaultCpuWeight: 'По умолчанию: {value, number}',

  // Original text: 'CPU cap'
  newVmCpuCapLabel: 'Ограничение CPU',

  // Original text: 'Default: {value, number}'
  newVmDefaultCpuCap: 'По умолчанию: {value, number}',

  // Original text: "Cloud config"
  newVmCloudConfig: 'Облачная конфигурация',

  // Original text: "Create VMs"
  newVmCreateVms: 'Создать виртуальные машины',

  // Original text: "Are you sure you want to create {nbVms, number} VMs?"
  newVmCreateVmsConfirm: 'Вы уверены, что хотите создать {nbVms, number} виртуальные машины?',

  // Original text: "Multiple VMs:"
  newVmMultipleVms: 'Несколько ВМ:',

  // Original text: 'Select a resource set:'
  newVmSelectResourceSet: 'Выберите набор ресурсов:',

  // Original text: 'Name pattern:'
  newVmMultipleVmsPattern: 'Образец имени:',

  // Original text: 'e.g.: \\{name\\}_%'
  newVmMultipleVmsPatternPlaceholder: 'например: \\{name\\}_%',

  // Original text: 'First index:'
  newVmFirstIndex: 'Первый индекс:',

  // Original text: 'Recalculate VMs number'
  newVmNumberRecalculate: 'Пересчитать количество ВМ',

  // Original text: 'Refresh VMs name'
  newVmNameRefresh: 'Обновить имя ВМ',

  // Original text: 'Affinity host'
  newVmAffinityHost: undefined,

  // Original text: 'Advanced'
  newVmAdvancedPanel: 'Дополнительно',

  // Original text: 'Show advanced settings'
  newVmShowAdvanced: 'Показать дополнительные параметры',

  // Original text: 'Hide advanced settings'
  newVmHideAdvanced: 'Скрыть дополнительные параметры',

  // Original text: 'Share this VM'
  newVmShare: 'Поделиться этой ВМ',

  // Original text: "Resource sets"
  resourceSets: 'Набор ресурсов',

  // Original text: "No resource sets."
  noResourceSets: 'Набор ресурсов не определен',

  // Original text: 'Loading resource sets'
  loadingResourceSets: 'Загрузить набор ресурсов',

  // Original text: "Resource set name"
  resourceSetName: 'Имя набора ресурсов',

  // Original text: 'Recompute all limits'
  recomputeResourceSets: 'Пересчитать все лимиты',

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
  availableHosts: 'Доступные Узлы',

  // Original text: "Excluded hosts"
  excludedHosts: 'Используемые Узлы',

  // Original text: "No hosts available."
  noHostsAvailable: 'Нет доступных Узлов',

  // Original text: "VMs created from this resource set shall run on the following hosts."
  availableHostsDescription: 'Виртуальные машины, созданные из этого набора ресурсов, должны работать на следующих Узлах.',

  // Original text: "Maximum CPUs"
  maxCpus: 'Максимум CPUs',

  // Original text: "Maximum RAM (GiB)"
  maxRam: 'Максимум памяти (ГиБ)',

  // Original text: "Maximum disk space"
  maxDiskSpace: 'Максимум дискового пространства',

  // Original text: 'IP pool'
  ipPool: 'Пул IP-адресов',

  // Original text: 'Quantity'
  quantity: 'Количество',

  // Original text: "No limits."
  noResourceSetLimits: 'Нет лимитов',

  // Original text: "Total:"
  totalResource: 'Итого:',

  // Original text: "Remaining:"
  remainingResource: 'Осталось:',

  // Original text: "Used:"
  usedResource: 'Используется:',

  // Original text: 'New'
  resourceSetNew: 'Новый',

  // Original text: "Try dropping some VMs files here, or click to select VMs to upload. Accept only .xva/.ova files."
  importVmsList:
    'Перетащите сюда несколько файлов виртуальных машин или нажмите, чтобы выбрать виртуальные машины для загрузки. Работает только с файлами .xva/.ova.',

  // Original text: "No selected VMs."
  noSelectedVms: 'Нет выбраных ВМ',

  // Original text: "To Pool:"
  vmImportToPool: 'В пул:',

  // Original text: "To SR:"
  vmImportToSr: 'В SR:',

  // Original text: "VMs to import"
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

  // Original text: 'N CPUs'
  nCpus: undefined,

  // Original text: 'Memory'
  vmMemory: 'Память',

  // Original text: 'Disk {position} ({capacity})'
  diskInfo: 'Диск {position} ({capacity})',

  // Original text: 'Disk description'
  diskDescription: 'Описание диска',

  // Original text: 'No disks.'
  noDisks: 'Нет дисков.',

  // Original text: 'No networks.'
  noNetworks: 'Нет сетей.',

  // Original text: 'Network {name}'
  networkInfo: 'Сеть {name}',

  // Original text: 'No description available'
  noVmImportErrorDescription: 'Описание не доступно',

  // Original text: 'Error:'
  vmImportError: 'Ошибка:',

  // Original text: '{type} file:'
  vmImportFileType: '{type} файла:',

  // Original text: 'Please to check and/or modify the VM configuration.'
  vmImportConfigAlert: 'Пожалуйста проверьте и/или модифицируйте конфигурацию ВМ.',

  // Original text: "No pending tasks"
  noTasks: 'Нет незаконченных задач',

  // Original text: "Currently, there are not any pending XenServer tasks"
  xsTasks: 'В настоящее время нет задач, ожидающих выполнения на XenServer.',

  // Original text: 'Schedules'
  backupSchedules: 'Расписания',

  // Original text: 'Get remote'
  getRemote: 'Получить удаленный доступ',

  // Original text: "List Remote"
  listRemote: 'Список дистанционных резервных копий',

  // Original text: "simple"
  simpleBackup: 'простой',

  // Original text: "delta"
  delta: 'дифференциальный',

  // Original text: "Restore Backups"
  restoreBackups: 'Восстановить резервную копию',

  // Original text: 'Click on a VM to display restore options'
  restoreBackupsInfo: 'Нажмите на ВМ для отображения параметров восстановления',

  // Original text: "Enabled"
  remoteEnabled: 'Доступно',

  // Original text: "Error"
  remoteError: 'Ошибка',

  // Original text: "No backup available"
  noBackup: 'Нет доступных резервных копий',

  // Original text: "VM Name"
  backupVmNameColumn: 'Имя ВМ',

  // Original text: 'Tags'
  backupTags: 'Тэги',

  // Original text: "Last Backup"
  lastBackupColumn: 'Последняя резервная копия',

  // Original text: "Available Backups"
  availableBackupsColumn: 'Доступные резервные копии',

  // Original text: 'Missing parameters'
  backupRestoreErrorTitle: 'Отсутствуют параметры',

  // Original text: 'Choose a SR and a backup'
  backupRestoreErrorMessage: 'Выберите SR и резервную копию',

  // Original text: 'Select default SR…'
  backupRestoreSelectDefaultSr: 'Выбрать SR по умолчанию...',

  // Original text: 'Choose a SR for each VDI'
  backupRestoreChooseSrForEachVdis: 'Выберите SR для каждого VDI',

  // Original text: 'VDI'
  backupRestoreVdiLabel: undefined,

  // Original text: 'SR'
  backupRestoreSrLabel: undefined,

  // Original text: 'Display backups'
  displayBackup: 'Отобразить резервные копии',

  // Original text: "Import VM"
  importBackupTitle: 'Импорт ВМ',

  // Original text: "Starting your backup import"
  importBackupMessage: 'Начинаем импорт резервной копии',

  // Original text: 'VMs to backup'
  vmsToBackup: 'ВМ для резервирования',

  // Original text: 'List remote backups'
  listRemoteBackups: 'Список дистанционных резервных копий',

  // Original text: 'Restore backup files'
  restoreFiles: 'Восстановить файлы резервных копий',

  // Original text: 'Invalid options'
  restoreFilesError: 'Недопустимый параметр',

  // Original text: 'Restore file from {name}'
  restoreFilesFromBackup: 'Восстановить файл из {name}',

  // Original text: 'Select a backup…'
  restoreFilesSelectBackup: 'Выберите резервную копию...',

  // Original text: 'Select a disk…'
  restoreFilesSelectDisk: 'Выберите диск...',

  // Original text: 'Select a partition…'
  restoreFilesSelectPartition: 'Выберите партицию...',

  // Original text: 'Folder path'
  restoreFilesSelectFolderPath: 'Путь к директории',

  // Original text: 'Select a file…'
  restoreFilesSelectFiles: 'Выберите файл…',

  // Original text: 'Content not found'
  restoreFileContentNotFound: 'Содержимое не найдено',

  // Original text: 'No files selected'
  restoreFilesNoFilesSelected: 'Нет выбраных файлов',

  // Original text: 'Selected files ({files}):'
  restoreFilesSelectedFiles: 'Выбранные файлы ({files}):',

  // Original text: 'Error while scanning disk'
  restoreFilesDiskError: 'Ошибка сканирования диска',

  // Original text: "Select all this folder's files"
  restoreFilesSelectAllFiles: 'Выбрать все файлы в директории',

  // Original text: 'Unselect all files'
  restoreFilesUnselectAll: 'Снять выделение со всех файлов',

  // Original text: 'Emergency shutdown Host{nHosts, plural, one {} other {s}}'
  emergencyShutdownHostsModalTitle: 'Аварийное отключение Уз{nHosts, plural, one {ла} other {лов}}',

  // Original text: 'Are you sure you want to shutdown {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  emergencyShutdownHostsModalMessage: 'Вы уверены что хотите выключить {nHosts, number} Уз{nHosts, plural, one {ел} other {ла}}?',

  // Original text: 'Shutdown host'
  stopHostModalTitle: 'Выключить Узел',

  // Original text: "This will shutdown your host. Do you want to continue? If it's the pool master, your connection to the pool will be lost"
  stopHostModalMessage: 'Это действие выключить ваш Узел. Вы хотите продолжить? Если это мастер пула, ваше соединение с пулом будет потеряно',

  // Original text: 'Add host'
  addHostModalTitle: 'Добавить Узел',

  // Original text: 'Are you sure you want to add {host} to {pool}?'
  addHostModalMessage: 'Вы уверены что хотите добавить {host} в {pool}',

  // Original text: 'Restart host'
  restartHostModalTitle: 'Перезапустить Узел',

  // Original text: 'This will restart your host. Do you want to continue?'
  restartHostModalMessage: 'Это дейтсвие перезагрузит Ваш Узел. Вы уверены что хотите это сделать?',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}'
  restartHostsAgentsModalTitle: 'Перезагрузить агент{nHosts, plural, one {а} other {ов}} на Уз{nHosts, plural, one {ле} other {лах}} ',

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}} agent{nHosts, plural, one {} other {s}}?'
  restartHostsAgentsModalMessage: 'Вы уверены что хотите перезагрузить агент{nHosts, plural, one {а} other {ов}} на {nHosts, number} Уз{nHosts, plural, one {ле} other {лах}} ?',

  // Original text: 'Restart Host{nHosts, plural, one {} other {s}}'
  restartHostsModalTitle: 'Перезагрузить Уз{nHosts, plural, one {ел} other {лы}}',

  // Original text: 'Are you sure you want to restart {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  restartHostsModalMessage: 'Вы уверены что хотите перезагрузить {nHosts, number} Уз{nHosts, plural, one {ел} other {ла}}?',

  // Original text: "Start VM{vms, plural, one {} other {s}}"
  startVmsModalTitle: 'Запустить ВМ{vms, plural, one {} other {s}}',

  // Original text: 'Start a copy'
  cloneAndStartVM: 'Начать копирование',

  // Original text: 'Force start'
  forceStartVm: 'Быстрый запуск',

  // Original text: 'Forbidden operation'
  forceStartVmModalTitle: 'Операция запрещена',

  // Original text: 'Start operation for this vm is blocked.'
  blockedStartVmModalMessage: 'Запуск операции для этой виртуальной машины заблокирован.',

  // Original text: 'Forbidden operation start for {nVms, number} vm{nVms, plural, one {} other {s}}.'
  blockedStartVmsModalMessage: 'Запрещен запуск операции для {nVms, number} ВМ.',

  // Original text: "Are you sure you want to start {vms, number} VM{vms, plural, one {} other {s}}?"
  startVmsModalMessage: 'Вы уверены, что хотите запустить {vms} ВМ?',

  // Original text: '{nVms, number} vm{nVms, plural, one {} other {s}} are failed. Please see your logs to get more information'
  failedVmsErrorMessage: '{nVms, number} ВМ с ошибкой. Посмотрите журналы для получения дополнительной информации',

  // Original text: 'Start failed'
  failedVmsErrorTitle: 'Не удалось запустить',

  // Original text: 'Stop Host{nHosts, plural, one {} other {s}}'
  stopHostsModalTitle: 'Остановить Уз{nHosts, plural, one {ел} other {ла}',

  // Original text: 'Are you sure you want to stop {nHosts, number} Host{nHosts, plural, one {} other {s}}?'
  stopHostsModalMessage: 'Вы уверены что хотите остановить {nHosts, number}  Уз{nHosts, plural, one {ел} other {ла}}?',

  // Original text: "Stop VM{vms, plural, one {} other {s}}"
  stopVmsModalTitle: 'Остановить ВМ{vms, plural, one {} other {s}}',

  // Original text: "Are you sure you want to stop {vms, number} VM{vms, plural, one {} other {s}}?"
  stopVmsModalMessage: 'Вы уверены, что хотите остановить {vms, number} ВМ?',

  // Original text: 'Restart VM'
  restartVmModalTitle: 'Перезапустить ВМ',

  // Original text: 'Are you sure you want to restart {name}?'
  restartVmModalMessage: 'Вы уверены что хотите перезапустить {name}?',

  // Original text: 'Stop VM'
  stopVmModalTitle: 'Остановить ВМ',

  // Original text: 'Are you sure you want to stop {name}?'
  stopVmModalMessage: 'Вы уверены что хотите остановить {name}?',

  // Original text: "Restart VM{vms, plural, one {} other {s}}"
  restartVmsModalTitle: 'Перезапустить ВМ',

  // Original text: "Are you sure you want to restart {vms, number} VM{vms, plural, one {} other {s}}?"
  restartVmsModalMessage: 'Вы уверены, что хотите перезапустить {vms, number} ВМ?',

  // Original text: "Snapshot VM{vms, plural, one {} other {s}}"
  snapshotVmsModalTitle: 'Снимок ВМ',

  // Original text: "Are you sure you want to snapshot {vms, number} VM{vms, plural, one {} other {s}}?"
  snapshotVmsModalMessage: 'Вы уверены, что хотите сделать снимки {vms, number} ВМ?',

  // Original text: "Delete VM{vms, plural, one {} other {s}}"
  deleteVmsModalTitle: 'Удалить ВМ',

  // Original text: "Are you sure you want to delete {vms, number} VM{vms, plural, one {} other {s}}? ALL VM DISKS WILL BE REMOVED"
  deleteVmsModalMessage:
    'Вы уверены, что хотите удалить {vms, number} ВМ? ВСЕ ДИСКИ ВИРТУАЛЬНЫХ МАШИН БУДУТ УДАЛЕНЫ!',

  // Original text: "Delete VM"
  deleteVmModalTitle: 'Удалить ВМ',

  // Original text: "Are you sure you want to delete this VM? ALL VM DISKS WILL BE REMOVED"
  deleteVmModalMessage: 'Вы уверены, что хотите удалить эту виртуальную машину? ВСЕ ДИСКИ ВИРТУАЛЬНОЙ МАШИНЫ БУДУТ УДАЛЕНЫ!',

  // Original text: "Migrate VM"
  migrateVmModalTitle: 'Переместить ВМ',

  // Original text: 'Select a destination host:'
  migrateVmSelectHost: 'Выберите Целевой Узел:',

  // Original text: 'Select a migration network:'
  migrateVmSelectMigrationNetwork: 'Выберите сеть для перемещения:',

  // Original text: 'For each VIF, select a network:'
  migrateVmSelectNetworks: 'Выберите сеть для каждого VIF:',

  // Original text: 'Select a destination SR:'
  migrateVmsSelectSr: 'Выберите целевую SR:',

  // Original text: 'Select a destination SR for local disks:'
  migrateVmsSelectSrIntraPool: 'Выберите целевую SR для локальных дисков:',

  // Original text: 'Select a network on which to connect each VIF:'
  migrateVmsSelectNetwork: 'Выберите сеть для подключения каждого VIF:',

  // Original text: 'Smart mapping'
  migrateVmsSmartMapping: undefined,

  // Original text: 'VIF'
  migrateVmVif: undefined,

  // Original text: 'Network'
  migrateVmNetwork: 'Сеть',

  // Original text: 'No target host'
  migrateVmNoTargetHost: 'Нет целевого Узла',

  // Original text: 'A target host is required to migrate a VM'
  migrateVmNoTargetHostMessage: 'Требуется указать целевой Узел для перемещения ВМ',

  // Original text: 'No default SR'
  migrateVmNoDefaultSrError: 'Нет SR по умолчанию',

  // Original text: 'Default SR not connected to host'
  migrateVmNotConnectedDefaultSrError: 'SR по умолчанию не подключен к Узлу',

  // Original text: 'For each VDI, select an SR:'
  chooseSrForEachVdisModalSelectSr: 'Выберите SR для каждого VDI:',

  // Original text: 'Select main SR…'
  chooseSrForEachVdisModalMainSr: 'Выберите основной SR',

  // Original text: 'VDI'
  chooseSrForEachVdisModalVdiLabel: undefined,

  // Original text: 'SR*'
  chooseSrForEachVdisModalSrLabel: undefined,

  // Original text: '* optional'
  optionalEntry: '* опционально',

  // Original text: 'Delete VDI'
  deleteVdiModalTitle: 'Удалить VDI',

  // Original text: 'Are you sure you want to delete this disk? ALL DATA ON THIS DISK WILL BE LOST'
  deleteVdiModalMessage: 'Вы уверены, что хотите удалить этот диск? ВСЕ ДАННЫЕ НА ЭТОМ ДИСКЕ БУДУТ ПОТЕРЯНЫ!',

  // Original text: 'Revert your VM'
  revertVmModalTitle: 'Вернуть ВМ',

  // Original text: 'Delete snapshot'
  deleteSnapshotModalTitle: 'Удалить снимок',

  // Original text: 'Are you sure you want to delete this snapshot?'
  deleteSnapshotModalMessage: 'Вы уверены, что хотите удалить этот снимок?',

  // Original text: 'Are you sure you want to revert this VM to the snapshot state? This operation is irreversible.'
  revertVmModalMessage: 'Вы уверены, что хотите вернуть состояние ВМ к состоянию на момент снимка? Эта операция необратима.',

  // Original text: 'Snapshot before'
  revertVmModalSnapshotBefore: 'Предыдущий снимок',

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
    'Этот путь ранее использовался Узлом XenServer в качестве хранилища. Все существующие данные будут потеряны, если вы продолжите создание SR.',

  // Original text: "Previous LUN Usage"
  existingLunModalTitle: 'Предыдущее использование LUN',

  // Original text: "This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation."
  existingLunModalText:
    'Этот LUN ранее использовался Узлом XenServer в качестве хранилища. Все существующие данные будут потеряны, если вы продолжите создание SR.',

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
  serverLabel: 'Метка',

  // Original text: "Host"
  serverHost: 'Узел',

  // Original text: "Username"
  serverUsername: 'Имя пользователя',

  // Original text: "Password"
  serverPassword: 'Пароль',

  // Original text: "Action"
  serverAction: 'Действие',

  // Original text: "Read Only"
  serverReadOnly: 'Только для чтения',

  // Original text: 'Unauthorized Certificates'
  serverUnauthorizedCertificates: 'Неавторизованные сертификаты',

  // Original text: 'Allow Unauthorized Certificates'
  serverAllowUnauthorizedCertificates: 'Разрешить неавторизованные сертификаты',

  // Original text: "Enable it if your certificate is rejected, but it's not recommended because your connection will not be secured."
  serverUnauthorizedCertificatesInfo: 'Разрешить принимать этот сертификат, если он отклонен. Это действие не рекомендуется, так как может быть не безопасным',

  // Original text: 'username'
  serverPlaceHolderUser: 'имя пользователя',

  // Original text: 'password'
  serverPlaceHolderPassword: 'пароль',

  // Original text: 'address[:port]'
  serverPlaceHolderAddress: 'адрес[:порт]',

  // Original text: 'label'
  serverPlaceHolderLabel: 'метка',

  // Original text: 'Connect'
  serverConnect: 'Подключить',

  // Original text: 'Error'
  serverError: 'Ошибка',

  // Original text: 'Adding server failed'
  serverAddFailed: 'Не удалось добавить сервер',

  // Original text: 'Status'
  serverStatus: 'Статус',

  // Original text: 'Connection failed. Click for more information.'
  serverConnectionFailed: 'Ошибка подключения. Нажмите для получения дополнительной информации.',

  // Original text: 'Connecting…'
  serverConnecting: 'Подключение...',

  // Original text: 'Authentication error'
  serverAuthFailed: 'Ошибка авторизации',

  // Original text: 'Unknown error'
  serverUnknownError: 'Неизвестная ошибка',

  // Original text: 'Invalid self-signed certificate'
  serverSelfSignedCertError: 'Ошибка самоподписанного сертификата',

  // Original text: 'Do you want to accept self-signed certificate for this server even though it would decrease security?'
  serverSelfSignedCertQuestion: 'Вы уверены, что хотите принять этот самоподписанный сертификат от этого сервера, даже если это снизит безопасность?',

  // Original text: "Copy VM"
  copyVm: 'Копировать ВМ',

  // Original text: "Are you sure you want to copy this VM to {SR}?"
  copyVmConfirm: 'Вы уверены, что хотите скопировать эту виртуальную машину на {SR}?',

  // Original text: "Name"
  copyVmName: 'Имя',

  // Original text: 'Name pattern'
  copyVmNamePattern: 'Имя партиции',

  // Original text: "If empty: name of the copied VM"
  copyVmNamePlaceholder: 'Если пусто: имя копируемой ВМ',

  // Original text: 'e.g.: "\\{name\\}_COPY"'
  copyVmNamePatternPlaceholder: 'например: "\\{name\\}_копия"',

  // Original text: "Select SR"
  copyVmSelectSr: 'Выберите SR',

  // Original text: "Use compression"
  copyVmCompress: 'Использовать сжатие',

  // Original text: 'No target SR'
  copyVmsNoTargetSr: 'Нет целевого SR',

  // Original text: 'A target SR is required to copy a VM'
  copyVmsNoTargetSrMessage: 'Целевой SR требует копирования ВМ',

  // Original text: 'Detach host'
  detachHostModalTitle: 'Отсоединить Узел',

  // Original text: 'Are you sure you want to detach {host} from its pool? THIS WILL REMOVE ALL VMs ON ITS LOCAL STORAGE AND REBOOT THE HOST.'
  detachHostModalMessage: 'Вы уверены, что хотите Отсоединить {host} от этого пула? ЭТО УДАЛИТ ВСЕ ВМ НА ЕГО ЛОКАЛЬНОМ ХРАНИЛИЩЕ И ПЕРЕЗАГРУЗИТ ХОСТ.',

  // Original text: 'Detach'
  detachHost: 'Отсоединить',

  // Original text: 'Forget host'
  forgetHostModalTitle: 'Забыть Узел',

  // Original text: "Are you sure you want to forget {host} from its pool? Be sure this host can't be back online, or use detach instead."
  forgetHostModalMessage: "Вы уверены, что хотите забыть {host} из этого пула? Убедитесь, что этот Узел не может вернуться в сеть, или используйте вместо этого отсоединение.",

  // Original text: 'Forget'
  forgetHost: 'Забыть',

  // Original text: "Create network"
  newNetworkCreate: 'Создать сеть',

  // Original text: 'Create bonded network'
  newBondedNetworkCreate: 'Создать связанную сеть',

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
  newNetworkNoNameErrorTitle: 'Необходимо задать имя',

  // Original text: 'A name is required to create a network'
  newNetworkNoNameErrorMessage: 'Необходимо задать имя для создания сети',

  // Original text: 'Bond mode'
  newNetworkBondMode: 'Режим связи',

  // Original text: "Delete network"
  deleteNetwork: 'Удалить сеть',

  // Original text: "Are you sure you want to delete this network?"
  deleteNetworkConfirm: 'Вы уверены что хотите удалить эту сеть?',

  // Original text: 'This network is currently in use'
  networkInUse: 'Эта сеть уже используется',

  // Original text: 'Bonded'
  pillBonded: 'Связана',

  // Original text: 'Host'
  addHostSelectHost: 'Узел',

  // Original text: 'No host'
  addHostNoHost: 'Нет Узла',

  // Original text: 'No host selected to be added'
  addHostNoHostMessage: 'Нет выбранных Узлов для добавления',

  // ----- About View -----
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

  // Original text:  'Want to use in production?',
  productionUse: 'Хочешь использовать на производстве?',
  
  // Original text:  'Get pro support with the Xen Orchestra Appliance at {website}',
  getSupport: 'Получай профессиональную поддержку для Xen Orchestra Appliance на {website}',
  
  // Original text: "You can download our turnkey appliance at {website}""
  downloadXoaFromWebsite: 'Вы можете скачать нашу сборку  Xen Orchestra с {веб-сайте}',

  // Original text: "Bug Tracker"
  bugTracker: 'БАГ-трекер',

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
  notAvailable: 'Эта функция недоступна в вашей версии. Чтобы узнать больше, обратитесь к администратору.',

  // Original text: 'Updates'
  updateTitle: 'Обновления',

  // Original text: "Registration"
  registration: 'Регистрация',

  // Original text: "Trial"
  trial: 'Пробный период',

  // Original text: "Settings"
  settings: 'Настройки',

  // Original text: 'Proxy settings'
  proxySettings: 'Настройки прокси',

  // Original text: 'Host (myproxy.example.org)'
  proxySettingsHostPlaceHolder: 'Узел (например: myproxy.example.org)',

  // Original text: 'Port (eg: 3128)'
  proxySettingsPortPlaceHolder: 'Порт (например: 3128)',

  // Original text: 'Username'
  proxySettingsUsernamePlaceHolder: 'Имя пользователя',

  // Original text: 'Password'
  proxySettingsPasswordPlaceHolder: 'Пароль',

  // Original text: 'Your email account'
  updateRegistrationEmailPlaceHolder: 'Ваш Email',

  // Original text: 'Your password'
  updateRegistrationPasswordPlaceHolder: 'Ваш пароль',

  // Original text: "Update"
  update: 'Обновить',

  // Original text: 'Refresh'
  refresh: 'Обновить',

  // Original text: "Upgrade"
  upgrade: 'Обновить',

  // Original text: "No updater available for Community Edition"
  noUpdaterCommunity: 'Для Community Edition обновления не доступны',

  // Original text: "Please consider subscribe and try it with all features for free during 15 days on {link}.""
  considerSubscribe: 'Пожалуйста, рассмотрите возможность подписки и попробуйте все функции бесплатно в течение 15 дней на {link}.',

  // Original text: "Manual update could break your current installation due to dependencies issues, do it with caution"
  noUpdaterWarning: 'Ручные обновления можут нарушить работоспособность ПО из-за проблем с зависимостями, делайте это с осторожностью',

  // Original text: "Current version:"
  currentVersion: 'Текущая версия:',

  // Original text: "Register"
  register: 'Регистрация',

  // Original text: 'Edit registration'
  editRegistration: 'Изменить регистрацию',

  // Original text: "Please, take time to register in order to enjoy your trial."
  trialRegistration: 'Пожалуйста, зарегистрируйтесь, чтобы испытать пробный период',

  // Original text: "Start trial"
  trialStartButton: 'Активировать пробный период',

  // Original text: "You can use a trial version until {date, date, medium}. Upgrade your appliance to get it."
  trialAvailableUntil: 'Вы можете использовать пробную версию до {date, date, medium}. Обновите свою установку Xen Orchestra, чтобы продолжить использовать все преимущества.',

  // Original text: "Your trial has been ended. Contact us or downgrade to Free version"
  trialConsumed: 'Ваш пробный период закончился. Свяжитесь с нами или вернитесь к бесплатной версии',

  // Original text: "Your xoa-updater service appears to be down. Your XOA cannot run fully without reaching this service."
  trialLocked: 'Ваша служба xoa-updater, похоже, не работает. XOA не может работать должным образом без обращения к этой службе',

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
  promptUpgradeReloadTitle: 'Обновление успешно завершено',

  // Original text: 'Your XOA has successfully upgraded, and your browser must reload the application. Do you want to reload now ?'
  promptUpgradeReloadMessage: 'Ваш XOA успешно обновлен, и ваш браузер должен перезагрузить приложение. Вы хотите перезагрузить XOA сейчас?',

  // ----- OS Disclaimer -----
  // Original text: "Xen Orchestra from the sources"
  disclaimerTitle: 'Xen Orchestra из исходного кода',

  // Original text: "You are using XO from the sources! That's great for a personal/non-profit usage."
  disclaimerText1: 'Вы используете XO из исходного кода! Отлично подходит для личного/некоммерческого использования',

  // Original text: "If you are a company, it's better to use it with our appliance + pro support included:"
  disclaimerText2: 'Если вы компания, лучше использовать ее с нашим устройством с включенной поддержкой Pro.',

  // Original text: "This version is not bundled with any support nor updates. Use it with caution for critical tasks."
  disclaimerText3: 'Если вы компания, лучше использовать ее с нашим устройством с включенной поддержкой Pro.',

  // Original text: 'Why do I see this message?',
  disclaimerText4: 'Почему я вижу это сообщение?',

  // Original text: 'You are not registered. Your XOA may not be up to date.',
  notRegisteredDisclaimerInfo: 'Вы не зарегистрированны. Ваша XOA может не включать послежние обновления.',

  // Original text: 'Click here to create an account.',
  notRegisteredDisclaimerCreateAccount: undefined,

  // Original text: 'Click here to register and update your XOA.',
  notRegisteredDisclaimerRegister: undefined,
  
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
  pifConnected: 'Подключен',

  // Original text: 'Disconnected'
  pifDisconnected: 'Отключен',

  // Original text: 'Physically connected'
  pifPhysicallyConnected: 'Подключен физически',

  // Original text: 'Physically disconnected'
  pifPhysicallyDisconnected: 'Отключен физически',

  // Original text: 'Username'
  username: 'Имя пользователя',

  // Original text: 'Password'
  password: 'Пароль',

  // Original text: 'Language'
  language: 'Язык',

  // Original text: 'Old password'
  oldPasswordPlaceholder: 'Старый пароль',

  // Original text: 'New password'
  newPasswordPlaceholder: 'Новый пароль',

  // Original text: 'Confirm new password'
  confirmPasswordPlaceholder: 'Подтвердите новый пароль',

  // Original text: 'Confirmation password incorrect'
  confirmationPasswordError: 'Неверный пароль для подтверждения',

  // Original text: 'Password does not match the confirm password.'
  confirmationPasswordErrorBody: 'Пароль не соответствует паролю подтверждения.',

  // Original text: 'Password changed'
  pwdChangeSuccess: 'Пароль изменён',

  // Original text: 'Your password has been successfully changed.'
  pwdChangeSuccessBody: 'Ваш пароль был успешно изменён.',

  // Original text: 'Incorrect password'
  pwdChangeError: 'Не корректный пароль',

  // Original text: 'The old password provided is incorrect. Your password has not been changed.'
  pwdChangeErrorBody: 'Введен не корректный старый пароль. Пароль небыл изменён.',

  // Original text: 'OK'
  changePasswordOk: undefined,

  // Original text: 'SSH keys'
  sshKeys: 'SSH-ключи',

  // Original text: 'New SSH key'
  newSshKey: 'Новый SSH-ключ',

  // Original text: 'Delete'
  deleteSshKey: 'Удалить',

  // Original text: 'No SSH keys'
  noSshKeys: 'Нет SSH-ключей',

  // Original text: 'New SSH key'
  newSshKeyModalTitle: 'Новый SSH-ключ',

  // Original text: 'Invalid key'
  sshKeyErrorTitle: 'Не верный ключ',

  // Original text: 'An SSH key requires both a title and a key.'
  sshKeyErrorMessage: 'SSH-ключ требует как заголовка, так и ключа.',

  // Original text: 'Title'
  title: 'Название',

  // Original text: 'Key'
  key: 'Ключ',

  // Original text: 'Delete SSH key'
  deleteSshKeyConfirm: 'Удалить SSH-ключ',

  // Original text: 'Are you sure you want to delete the SSH key {title}?'
  deleteSshKeyConfirmMessage: 'Вы уверены, что хотите удалить SSH-ключ {title}',

  // Original text: 'Others'
  others: 'Прочее',

  // Original text: 'Loading logs…'
  loadingLogs: 'Загругка журналов...',

  // Original text: 'User'
  logUser: 'Пользователь',

  // Original text: 'Method'
  logMethod: 'Метод',

  // Original text: 'Params'
  logParams: 'Параметры',

  // Original text: 'Message'
  logMessage: 'Сообщение',

  // Original text: 'Error'
  logError: 'Ошибка',

  // Original text: 'Display details'
  logDisplayDetails: 'Показать детализацию',

  // Original text: 'Date'
  logTime: 'Дата',

  // Original text: 'No stack trace'
  logNoStackTrace: 'Нет стэка вызовов',

  // Original text: 'No params'
  logNoParams: 'Нет параметров',

  // Original text: 'Delete log'
  logDelete: 'Удалить журнал',

  // Original text: 'Delete all logs'
  logDeleteAll: 'Удалить все журналы',

  // Original text: 'Delete all logs'
  logDeleteAllTitle: 'Удалить все журналы',

  // Original text: 'Are you sure you want to delete all the logs?'
  logDeleteAllMessage: 'Вы уверены, что хотите уделатьи все журналы?',

  // Original text: 'Click to enable'
  logIndicationToEnable: 'Нажать для включения',

  // Original text: 'Click to disable'
  logIndicationToDisable: 'Нажать для отключения',

  // Original text: 'Report a bug'
  reportBug: 'Сообщить об ошибке',

  // Original text: 'Name'
  ipPoolName: 'Имя',

  // Original text: 'IPs'
  ipPoolIps: 'IP-адреса',

  // Original text: 'IPs (e.g.: 1.0.0.12-1.0.0.17;1.0.0.23)'
  ipPoolIpsPlaceholder: 'IP-адреса (например: 1.0.0.12-1.0.0.17;1.0.0.23)',

  // Original text: 'Networks'
  ipPoolNetworks: 'Сети',

  // Original text: 'No IP pools'
  ipsNoIpPool: 'Нет пула IP-адресов',

  // Original text: 'Create'
  ipsCreate: 'Создать',

  // Original text: 'Delete all IP pools'
  ipsDeleteAllTitle: 'Удалить все пулы IP-адресов',

  // Original text: 'Are you sure you want to delete all the IP pools?'
  ipsDeleteAllMessage: 'Вы уверены, что хотите удалить все пулы IP-адресов?',

  // Original text: 'VIFs'
  ipsVifs: undefined,

  // Original text: 'Not used'
  ipsNotUsed: 'Не используется',

  // Original text: 'unknown VIF'
  ipPoolUnknownVif: 'Не известный VIF',

  // Original text: 'Name already exists'
  ipPoolNameAlreadyExists: 'Имя уже используется',

  // Original text: 'Keyboard shortcuts'
  shortcutModalTitle: 'Горячие клавиши',

  // Original text: 'Global'
  shortcut_XoApp: 'Общее',

  // Original text: 'Go to hosts list'
  shortcut_GO_TO_HOSTS: 'Перейти в список Узлов',

  // Original text: 'Go to pools list'
  shortcut_GO_TO_POOLS: 'Перейти в список Пулов',

  // Original text: 'Go to VMs list'
  shortcut_GO_TO_VMS: 'Перейти в список виртуальных машин',

  // Original text: 'Go to SRs list'
  shortcut_GO_TO_SRS: 'Перейти в список SR',

  // Original text: 'Create a new VM'
  shortcut_CREATE_VM: 'Создать новую ВМ',

  // Original text: 'Unfocus field'
  shortcut_UNFOCUS: 'Снять фокусировку',

  // Original text: 'Show shortcuts key bindings'
  shortcut_HELP: 'Показать "горячие клавиши"',

  // Original text: 'Home'
  shortcut_Home: 'Главная',

  // Original text: 'Focus search bar'
  shortcut_SEARCH: 'Поисковая панель',

  // Original text: 'Next item'
  shortcut_NAV_DOWN: 'Следующее значение',

  // Original text: 'Previous item'
  shortcut_NAV_UP: 'Предыдущее значение',

  // Original text: 'Select item'
  shortcut_SELECT: 'Выбрать значение',

  // Original text: 'Open'
  shortcut_JUMP_INTO: 'Открыть',

  // Original text: 'VM'
  settingsAclsButtonTooltipVM: 'ВМ',

  // Original text: 'Hosts'
  settingsAclsButtonTooltiphost: 'Узлы',

  // Original text: 'Pool'
  settingsAclsButtonTooltippool: 'Пул',

  // Original text: 'SR'
  settingsAclsButtonTooltipSR: undefined,

  // Original text: 'Network'
  settingsAclsButtonTooltipnetwork: 'Сеть',

  // Original text: 'No config file selected'
  noConfigFile: 'Файл конфигурации не выбран',

  // Original text: 'Try dropping a config file here, or click to select a config file to upload.'
  importTip: 'Перетащите сюда файл конфигурации или нажмите, чтобы выбрать файл конфигурации для загрузки.',

  // Original text: 'Config'
  config: 'Конфигурация',

  // Original text: 'Import'
  importConfig: 'Импорт',

  // Original text: 'Config file successfully imported'
  importConfigSuccess: 'Файл конфигурации успешно импортирован',

  // Original text: 'Error while importing config file'
  importConfigError: 'Ошибка импортирования файла конфигурации',

  // Original text: 'Export'
  exportConfig: 'Экспорт',

  // Original text: 'Download current config'
  downloadConfig: 'Скачать файл с текущей конфигурации',

  // Original text: 'No config import available for Community Edition'
  noConfigImportCommunity: 'Community Edition не поддердивает возможность импорта файла конфигурации',

  // Original text: 'Reconnect all hosts'
  srReconnectAllModalTitle: 'Переподключить все Узлы',

  // Original text: 'This will reconnect this SR to all its hosts.'
  srReconnectAllModalMessage: 'Это действие повторно подключит этот SR ко всем его узлам.',

  // Original text: 'This will reconnect each selected SR to its host (local SR) or to every hosts of its pool (shared SR).'
  srsReconnectAllModalMessage: 'Это действие приведет к повторному подключению каждого выбранного SR к его узлам (для локальных SR) или к каждому узлу из его пула (для общих SR).',

  // Original text: 'Disconnect all hosts'
  srDisconnectAllModalTitle: 'Отключить все Узлы',

  // Original text: 'This will disconnect this SR from all its hosts.'
  srDisconnectAllModalMessage: 'Это действие отключить этот SR от всех его Узлов.',

  // Original text: 'This will disconnect each selected SR from its host (local SR) or from every hosts of its pool (shared SR).'
  srsDisconnectAllModalMessage: 'Это действие отключит каждый выбранный SR от его Узла (для локальных SR) или от всех Узлов его пула (для общих SR)',

  // Original text: 'Forget SR'
  srForgetModalTitle: 'Забыть SR',

  // Original text: 'Forget selected SRs'
  srsForgetModalTitle: 'Забыть выбранные SR',

  // Original text: "Are you sure you want to forget this SR? VDIs on this storage won't be removed."
  srForgetModalMessage: "Вы уверены, что хотите забыть этот SR? VDI на этом хранилище будут удалены.",

  // Original text: "Are you sure you want to forget all the selected SRs? VDIs on these storages won't be removed."
  srsForgetModalMessage: "Вы уверены, что хотите забыть все выбранные SR? VDI на этих хранилищах будут удалены.",

  // Original text: 'Disconnected'
  srAllDisconnected: 'Отключен',

  // Original text: 'Partially connected'
  srSomeConnected: 'Частично подключен',

  // Original text: 'Connected'
  srAllConnected: 'Подключен',

  // Original text: 'XOSAN'
  xosanTitle: undefined,

  // Original text: 'Xen Orchestra SAN SR'
  xosanSrTitle: undefined,

  // Original text: 'Select local SRs (lvm)'
  xosanAvailableSrsTitle: 'Выберите локальные SRs (lvm)',

  // Original text: 'Suggestions'
  xosanSuggestions: 'Предложения',

  // Original text: 'Name'
  xosanName: 'Имя',

  // Original text: 'Host'
  xosanHost: 'Узел',

  // Original text: 'Hosts'
  xosanHosts: 'Узлы',

  // Original text: 'Volume ID'
  xosanVolumeId: 'Идентификатор тома',

  // Original text: 'Size'
  xosanSize: 'Размер',

  // Original text: 'Used space'
  xosanUsedSpace: 'Используемое пространство',

  // Original text: 'XOSAN pack needs to be installed on each host of the pool.'
  xosanNeedPack: 'Пакет XOSAN необходимо установить на каждом Узле Пула.',

  // Original text: 'Install it now!'
  xosanInstallIt: 'Установить сейчас!',

  // Original text: 'Some hosts need their toolstack to be restarted before you can create an XOSAN'
  xosanNeedRestart: 'Некоторым хостам требуется перезапуск системных служб, прежде чем вы сможете создать XOSAN.',

  // Original text: 'Restart toolstacks'
  xosanRestartAgents: 'Перезапустить службы',

  // Original text: 'Pool master is not running'
  xosanMasterOffline: 'Мастер пула не запущен',

  // Original text: 'Install XOSAN pack on {pool}'
  xosanInstallPackTitle: 'Установить пакет XOSAN на {pool}',

  // Original text: 'Select at least 2 SRs'
  xosanSelect2Srs: 'Выберите как минимум 2 SR',

  // Original text: 'Layout'
  xosanLayout: 'Расположение',

  // Original text: 'Redundancy'
  xosanRedundancy: 'Избыточность',

  // Original text: 'Capacity'
  xosanCapacity: 'Ёмкость',

  // Original text: 'Available space'
  xosanAvailableSpace: 'Доступное место',

  // Original text: '* Can fail without data loss'
  xosanDiskLossLegend: '* Может выйти из строя без потери данных',

  // Original text: 'Create'
  xosanCreate: 'Создать',

  // Original text: 'Installing XOSAN. Please wait…'
  xosanInstalling: 'Утанавливается пакет XOSAN. Пожалуйста подождите...',

  // Original text: 'No XOSAN available for Community Edition'
  xosanCommunity: 'Пакет XOSAN не доступен на Community Edition',

  // Original text: 'Install cloud plugin first'
  xosanInstallCloudPlugin: 'Сначала установить облачный плагин',

  // Original text: 'Load cloud plugin first'
  xosanLoadCloudPlugin: 'Сначала загрущите облачный плагин',

  // Original text: 'Loading…'
  xosanLoading: 'Загрузка...',

  // Original text: 'XOSAN is not available at the moment'
  xosanNotAvailable: 'В данный момент XOSAN не доступен',

  // Original text: 'Register for the XOSAN beta'
  xosanRegisterBeta: 'Зарегистрируйтесь для участия в бэта-тестировании XOSAN',

  // Original text: 'You have successfully registered for the XOSAN beta. Please wait until your request has been approved.'
  xosanSuccessfullyRegistered: 'Вы успешно зарегистрировались для участия в бета-тестировании XOSAN. Подождите, пока ваш запрос не будет одобрен.',

  // Original text: 'Install XOSAN pack on these hosts:'
  xosanInstallPackOnHosts: 'Установите пакет XOSAN на эти хосты:',

  // Original text: 'Install {pack} v{version}?'
  xosanInstallPack: 'Установить {pack} v{version}?',

  // Original text: 'No compatible XOSAN pack found for your XenServer versions.'
  xosanNoPackFound: 'Для ваших версий XenServer не найден совместимый пакет XOSAN.',

  // Original text: 'At least one of these version requirements must be satisfied by all the hosts in this pool:'
  xosanPackRequirements: 'По крайней мере одно из этих требований к версии должно удовлетворять всем Узлам в этом Пуле:',
  
  // Original text: 'Snapshots'
  homeSortVmsBySnapshots: 'Снимки',

  // Original text: 'Container'
  homeSortByContainer: 'Контейнеры',

  // Original text: 'Start time'
  homeSortByStartTime: 'Время запуска',

  // Original text: 'All VMs'
  allVms: 'Все ВМ',

  // Original text: 'Backed up VMs'
  backedUpVms: 'ВМ с резервными копиями',

  // Original text: 'Not backed up VMs'
  notBackedUpVms: 'ВМ без резервных копий', 

  // Original text: 'Save'
  formSave: 'Сохранить',
}
