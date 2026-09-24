import type { DockerConnectionSaveRequest } from '@/modules/docker/jobs/xo-docker-args.ts'
import type {
  DockerEngineCreatePayload,
  DockerEngineUpdatePayload,
  FrontXoDockerEngine,
} from '@/modules/docker/types/docker.type.ts'
import { getVmSshCandidateAddresses, isSshFingerprint, isSshPrivateKey } from '@/modules/docker/utils/xo-docker.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { integer, maxValue, minValue, required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Value of the address select meaning "use the custom host input"
 */
export const CUSTOM_HOST = '$custom-host'

export const DEFAULT_SSH_PORT = 22

export const DEFAULT_SOCKET_PATH = '/var/run/docker.sock'

export type DockerConnectionFormData = {
  /** a known address of the VM, or `CUSTOM_HOST` */
  host: string
  customHost: string
  port: number | undefined
  username: string
  privateKey: string
  passphrase: string
  socketPath: string
  hostKeyFingerprint: string
}

export function useDockerConnectionForm(
  rawVm: MaybeRefOrGetter<Pick<FrontXoVm, 'id' | 'addresses' | 'mainIpAddress'>>,
  rawEngine: MaybeRefOrGetter<FrontXoDockerEngine | undefined> = undefined
) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)
  const engine = toComputed(rawEngine)

  const candidateAddresses = computed(() => getVmSshCandidateAddresses(vm.value))

  const hasCandidateAddresses = computed(() => candidateAddresses.value.length > 0)

  const isEditing = computed(() => engine.value !== undefined)

  // editing: the stored key is never sent back, it is kept unless replaced
  const replacePrivateKey = ref(false)

  const mustSendPrivateKey = computed(() => !isEditing.value || replacePrivateKey.value)

  function getInitialHost(): Pick<DockerConnectionFormData, 'host' | 'customHost'> {
    const host = engine.value?.host ?? engine.value?.resolvedHost

    if (host !== undefined && !candidateAddresses.value.includes(host)) {
      return { host: CUSTOM_HOST, customHost: host }
    }

    return { host: host ?? candidateAddresses.value[0] ?? CUSTOM_HOST, customHost: '' }
  }

  const formData = reactive<DockerConnectionFormData>({
    ...getInitialHost(),
    port: engine.value?.port ?? DEFAULT_SSH_PORT,
    username: engine.value?.username ?? '',
    privateKey: '',
    passphrase: '',
    socketPath: engine.value?.socketPath ?? DEFAULT_SOCKET_PATH,
    hostKeyFingerprint: engine.value?.hostKeyFingerprint ?? '',
  })

  const isCustomHost = computed(() => formData.host === CUSTOM_HOST)

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onBlur: () => ({
        port: {
          integer: withMessage(integer, t('port-invalid')),
          minValue: withMessage(minValue(1), t('port-invalid')),
          maxValue: withMessage(maxValue(65535), t('port-invalid')),
        },
        privateKey: {
          sshPrivateKey: withMessage(
            (value: unknown) => typeof value !== 'string' || value === '' || isSshPrivateKey(value),
            t('docker-ssh-private-key-invalid')
          ),
        },
        hostKeyFingerprint: {
          sshFingerprint: withMessage(
            (value: unknown) => typeof value !== 'string' || value.trim() === '' || isSshFingerprint(value),
            t('docker-host-key-fingerprint-invalid')
          ),
        },
        socketPath: {
          absolutePath: withMessage(
            (value: unknown) => typeof value !== 'string' || value === '' || value.startsWith('/'),
            t('docker-socket-path-invalid')
          ),
        },
      }),
      onSubmit: () => ({
        host: { required },
        customHost: { required: requiredIf(() => isCustomHost.value) },
        port: { required: withMessage(required, t('port-required')) },
        username: { required: withMessage(required, t('job:arg:username-required')) },
        privateKey: { required: requiredIf(() => mustSendPrivateKey.value) },
      }),
    },
  })

  const addressOptions = computed(() => [
    ...candidateAddresses.value.map(address => ({ id: address, value: address, label: address })),
    { id: CUSTOM_HOST, value: CUSTOM_HOST, label: t('docker-address-custom') },
  ])

  const { id: addressSelectId } = useFormSelect('host', addressOptions, {
    required: true,
    option: {
      label: 'label',
      value: 'value',
    },
  })

  function getHost() {
    return (isCustomHost.value ? formData.customHost : formData.host).trim()
  }

  function buildCreatePayload(): DockerEngineCreatePayload {
    const fingerprint = formData.hostKeyFingerprint.trim()
    const socketPath = formData.socketPath.trim()

    return {
      $VM: vm.value.id,
      host: getHost(),
      port: formData.port!,
      username: formData.username.trim(),
      privateKey: formData.privateKey,
      ...(formData.passphrase !== '' && { passphrase: formData.passphrase }),
      ...(socketPath !== '' && socketPath !== DEFAULT_SOCKET_PATH && { socketPath }),
      ...(fingerprint !== '' && { hostKeyFingerprint: fingerprint }),
    }
  }

  function buildUpdatePayload(): DockerEngineUpdatePayload {
    const fingerprint = formData.hostKeyFingerprint.trim()
    const socketPath = formData.socketPath.trim()

    return {
      host: getHost(),
      port: formData.port!,
      username: formData.username.trim(),
      socketPath: socketPath === '' ? DEFAULT_SOCKET_PATH : socketPath,
      ...(replacePrivateKey.value && {
        privateKey: formData.privateKey,
        passphrase: formData.passphrase,
      }),
      ...(fingerprint !== (engine.value?.hostKeyFingerprint ?? '') &&
        fingerprint !== '' && { hostKeyFingerprint: fingerprint }),
    }
  }

  async function validateAndBuildRequest(): Promise<DockerConnectionSaveRequest | undefined> {
    if (!(await validate())) {
      return undefined
    }

    if (engine.value !== undefined) {
      return { engineId: engine.value.id, payload: buildUpdatePayload() }
    }

    return { payload: buildCreatePayload() }
  }

  /**
   * The private key and its passphrase must not linger in the reactive state
   * once sent
   */
  function clearSecrets() {
    formData.privateKey = ''
    formData.passphrase = ''
  }

  return {
    formData,
    candidateAddresses,
    hasCandidateAddresses,
    isCustomHost,
    isEditing,
    replacePrivateKey,
    mustSendPrivateKey,
    addressSelectBindings: useSelect(addressSelectId, () => ({ label: t('docker-vm-address') })),
    customHostInputBindings: useField('customHost', () => ({ label: t('docker-vm-address'), required: true })),
    portInputBindings: useField('port', () => ({ label: t('docker-ssh-port'), required: true })),
    usernameInputBindings: useField('username', () => ({ label: t('username'), required: true })),
    privateKeyBindings: useField('privateKey', () => ({ label: t('docker-ssh-private-key'), required: true })),
    passphraseInputBindings: useField('passphrase', () => ({ label: t('docker-ssh-passphrase') })),
    socketPathInputBindings: useField('socketPath', () => ({ label: t('docker-socket-path') })),
    fingerprintInputBindings: useField('hostKeyFingerprint', () => ({ label: t('docker-host-key-fingerprint') })),
    validateAndBuildRequest,
    clearSecrets,
  }
}
