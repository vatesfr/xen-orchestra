import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { NewSrRestPayload } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import {
  type NewSrFormData,
  type NewSrType,
  SR_CONTENT_GROUP,
  SR_PREFERRED_IMAGE_FORMATS,
  type SrContentGroup,
} from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import {
  buildNewSrInput,
  buildNewSrRestPayload,
  getAvailableSrTypes,
  groupSrTypesByContent,
  SR_TYPE_META,
} from '@/modules/storage-repository/utils/xo-sr-create.util.ts'
import { objectIcon, type IconName } from '@core/icons'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { useValidatedForm } from '@core/packages/validated-form'
import { SR_ACCESS_MODE } from '@core/types/storage-repository.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { toLower } from 'lodash-es'
import { computed, type MaybeRefOrGetter, reactive, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNewSrForm(
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>,
  rawHostId?: MaybeRefOrGetter<FrontXoHost['id'] | undefined>
) {
  const { t } = useI18n()

  const contextPoolId = toComputed(rawPoolId)
  const contextHostId = toComputed(rawHostId)

  const defaultAccessMode = contextHostId.value !== undefined ? SR_ACCESS_MODE.LOCAL : SR_ACCESS_MODE.SHARED

  const formData = reactive<NewSrFormData>({
    poolId: undefined,
    hostId: undefined,
    accessMode: defaultAccessMode,
    type: undefined,
    name: '',
    description: '',
    device: '',
    server: '',
    path: '',
    username: '',
    password: '',
    useAuth: false,
    preferredImageFormats: '',
  })

  const { pools, getPoolById } = useXoPoolCollection()

  const { hostsByPool } = useXoHostCollection()

  const poolHosts = computed(() => (formData.poolId ? (hostsByPool.value.get(formData.poolId) ?? []) : []))

  const isLocalAccessMode = computed(() => formData.accessMode === SR_ACCESS_MODE.LOCAL)

  const isHostSelectDisabled = computed(() => !isLocalAccessMode.value)

  const availableSrTypes = computed(() => getAvailableSrTypes(formData.accessMode))

  const srTypeLabels = computed(
    () =>
      ({
        lvm: t('lvm'),
        ext: t('ext'),
        smb: t('smb'),
        local: t('local'),
        smbiso: t('smbiso'),
      }) satisfies Record<NewSrType, string>
  )

  const typeGroups = computed(() => groupSrTypesByContent(availableSrTypes.value))

  const typeOptions = computed(() => {
    const groups = typeGroups.value

    const result: Array<{
      id: NewSrType
      label: string
      value: NewSrType
      icon: IconName
      group: SrContentGroup
      isFirstInGroup: boolean
    }> = []

    for (const group of Object.values(SR_CONTENT_GROUP)) {
      groups[group].forEach((srType, index) => {
        result.push({
          id: srType,
          label: srTypeLabels.value[srType],
          value: srType,
          icon: 'object:sr',
          group,
          isFirstInGroup: index === 0,
        })
      })
    }

    return result
  })

  const poolOptions = computed(() =>
    pools.value.map(pool => ({
      id: pool.id,
      label: pool.name_label,
      value: pool.id,
      icon: 'object:pool' as const,
    }))
  )

  const hostOptions = computed(() =>
    poolHosts.value.map(host => ({
      id: host.id,
      label: host.name_label,
      value: host.id,
      icon: objectIcon('host', toLower(host.power_state)),
    }))
  )

  const requiresEraseConfirm = computed(() => {
    const srType = formData.type

    return srType !== undefined && SR_TYPE_META[srType].requiresEraseConfirm
  })

  const supportsPreferredImageFormats = computed(() => {
    const srType = formData.type

    return srType !== undefined && SR_TYPE_META[srType].supportsPreferredImageFormats
  })

  const preferredImageFormatsOptions = computed(() =>
    SR_PREFERRED_IMAGE_FORMATS.map(format => ({
      id: format,
      label: format,
      value: format,
    }))
  )

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        poolId: { required: withMessage(required, () => t('pool-required')) },
        hostId: { required: withMessage(required, () => t('host-required')) },
        type: { required },
        name: { required },
        device: {
          requiredIf: requiredIf(() => formData.type === 'lvm' || formData.type === 'ext'),
        },
        server: {
          requiredIf: requiredIf(() => formData.type === 'smb' || formData.type === 'smbiso'),
        },
        path: {
          requiredIf: requiredIf(() => formData.type === 'local'),
        },
      }),
    },
  })

  const { id: poolSelectId } = useFormSelect('poolId', poolOptions, {
    searchable: true,
    required: true,
    option: { label: 'label', value: 'value', properties: source => ({ icon: source.icon }) },
  })

  const { id: hostSelectId } = useFormSelect('hostId', hostOptions, {
    searchable: true,
    required: true,
    disabled: isHostSelectDisabled,
    option: { label: 'label', value: 'value', properties: source => ({ icon: source.icon }) },
  })

  const { id: typeSelectId } = useFormSelect('type', typeOptions, {
    required: true,
    option: {
      label: 'label',
      value: 'value',
      properties: source => ({
        icon: source.icon,
        group: source.group,
        isFirstInGroup: source.isFirstInGroup,
      }),
    },
  })

  const { id: preferredImageFormatsSelectId } = useFormSelect('preferredImageFormats', preferredImageFormatsOptions, {
    emptyOption: {
      label: '',
      value: '',
    },
    option: { label: 'label', value: 'value' },
  })

  const nameInputBindings = useField('name', () => ({ label: t('name'), required: true }))
  const descriptionInputBindings = useField('description', () => ({
    label: t('description'),
  }))
  const accessModeInputBindings = useField('accessMode', () => ({
    label: t('access-mode'),
  }))
  const poolSelect = useSelect(poolSelectId, () => ({ label: t('pool') }))
  const hostSelect = useSelect(hostSelectId, () => ({ label: t('host') }))
  const typeSelect = useSelect(typeSelectId, () => ({ label: t('type') }))

  // `useSelect` erases the select type: the option slots of these selects need their properties
  const poolSelectBindings = computed(() => ({ ...poolSelect.value, id: poolSelectId }))
  const hostSelectBindings = computed(() => ({ ...hostSelect.value, id: hostSelectId }))
  const typeSelectBindings = computed(() => ({ ...typeSelect.value, id: typeSelectId }))
  const preferredImageFormatsSelectBindings = useSelect(preferredImageFormatsSelectId, () => ({
    label: t('sr-preferred-image-formats'),
    info: t('sr-preferred-image-formats-info'),
    ...(formData.preferredImageFormats.includes('qcow2') && {
      warning: { content: t('sr-preferred-image-formats-qcow2-warning'), accent: 'warning' },
    }),
  }))
  const deviceInputBindings = useField('device', () => ({ label: t('device'), required: true }))
  const serverInputBindings = useField('server', () => ({ label: t('server'), required: true }))
  const pathInputBindings = useField('path', () => ({ label: t('path'), required: true }))
  const usernameInputBindings = useField('username', () => ({ label: t('username') }))
  const passwordInputBindings = useField('password', () => ({ label: t('password') }))

  /** Set formData.hostId to the selected pool's master host */
  function selectPoolMaster() {
    if (formData.poolId === undefined) {
      return
    }

    const masterHostId = getPoolById(formData.poolId)?.master

    if (masterHostId !== undefined) {
      formData.hostId = masterHostId
    }
  }

  /** Select pool from page context on form init */
  watch(
    [pools, contextPoolId],
    () => {
      if (formData.poolId !== undefined) {
        return
      }

      formData.poolId = getPoolById(contextPoolId.value)?.id
    },
    { immediate: true }
  )

  /** Select the pool's master host on init, pool change, switch to shared access mode, or when pools are loaded */
  watch(
    [() => formData.poolId, isLocalAccessMode, pools],
    () => {
      if (isLocalAccessMode.value) {
        return
      }

      selectPoolMaster()
    },
    { immediate: true }
  )

  /** Select host from page context on form init if access mode is local */
  watch(
    [poolHosts, contextHostId, isLocalAccessMode],
    () => {
      if (!isLocalAccessMode.value || formData.hostId !== undefined || contextHostId.value === undefined) {
        return
      }

      const host = poolHosts.value.find(poolHost => poolHost.id === contextHostId.value)

      if (host) {
        formData.hostId = host.id
      }
    },
    { immediate: true }
  )

  /**
   * Select the pool's master host when the pool changes
   * Skip if there was no previous pool selection (on form init)
   * Skip if shared access mode: selectPoolMaster already called by the shared access mode watcher
   */
  watch(
    () => formData.poolId,
    (_newPoolId, oldPoolId) => {
      if (oldPoolId === undefined || !isLocalAccessMode.value) {
        return
      }

      selectPoolMaster()
    }
  )

  /** Reset type and type-specific fields when the access mode changes */
  watch(
    () => formData.accessMode,
    () => {
      formData.type = undefined
      formData.device = ''
      formData.server = ''
      formData.path = ''
      formData.username = ''
      formData.password = ''
      formData.useAuth = false
      formData.preferredImageFormats = ''
    }
  )

  /** Reset preferred image formats when needed */
  watch(
    () => formData.type,
    type => {
      if (type === undefined || !SR_TYPE_META[type].supportsPreferredImageFormats) {
        formData.preferredImageFormats = ''
      }
    }
  )

  async function validateAndBuildPayload(): Promise<NewSrRestPayload | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    const hostId = formData.hostId
    const { type } = formData

    if (hostId === undefined || type === undefined) {
      return undefined
    }

    const input = buildNewSrInput({ ...formData, type }, hostId)

    return buildNewSrRestPayload(input)
  }

  const { open: openEraseConfirmModal } = useOverlay({
    component: () => import('@/modules/storage-repository/components/modal/SrCreateEraseConfirmModal.vue'),
    events: { onConfirm: true, onCancel: true },
  })

  /** Validate the form and build its payload, once the user agreed to erase the device of an SR type that formats it */
  async function submit(): Promise<NewSrRestPayload | undefined> {
    const restPayload = await validateAndBuildPayload()

    if (restPayload === undefined || !requiresEraseConfirm.value) {
      return restPayload
    }

    const response = await openEraseConfirmModal({ props: { device: formData.device } })

    return response.event === 'onConfirm' ? restPayload : undefined
  }

  return {
    nameInputBindings,
    descriptionInputBindings,
    accessModeInputBindings,
    poolSelectBindings,
    hostSelectBindings,
    typeSelectBindings,
    type: toRef(formData, 'type'),
    deviceInputBindings,
    serverInputBindings,
    pathInputBindings,
    usernameInputBindings,
    passwordInputBindings,
    useAuth: toRef(formData, 'useAuth'),
    supportsPreferredImageFormats,
    preferredImageFormatsSelectBindings,
    submit,
  }
}
