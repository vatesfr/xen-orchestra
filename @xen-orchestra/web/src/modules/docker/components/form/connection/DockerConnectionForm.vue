<template>
  <UiCard class="docker-connection-form">
    <UiTitle>{{ isEditing ? t('action:configure-monitoring') : t('docker-not-configured-title') }}</UiTitle>
    <p class="description typo-body-regular-small">{{ t('docker-not-configured-description') }}</p>

    <VtsForm class="form" @submit="onSubmit()">
      <div class="row">
        <DockerAddressField
          :has-candidate-addresses
          :is-custom-host
          :select-bindings="addressSelectBindings"
          :custom-host-bindings="customHostInputBindings"
        />
        <DockerPortInput v-bind="portInputBindings" />
      </div>

      <div class="row">
        <DockerTextInput v-bind="usernameInputBindings" />
        <div />
      </div>

      <UiCheckbox v-if="isEditing" v-model="replacePrivateKey" accent="brand">
        {{ t('docker-ssh-private-key-replace') }}
      </UiCheckbox>
      <p v-if="isEditing && !replacePrivateKey" class="key-kept typo-body-regular-small">
        {{ t('docker-ssh-private-key-keep') }}
      </p>

      <div v-if="mustSendPrivateKey" class="row">
        <DockerPrivateKeyTextarea v-bind="privateKeyBindings" />
        <DockerTextInput v-bind="passphraseInputBindings" type="password" :info="t('docker-ssh-passphrase-info')" />
      </div>

      <div class="row">
        <DockerTextInput
          v-bind="fingerprintInputBindings"
          placeholder="SHA256:…"
          :info="t('docker-host-key-fingerprint-info', { command: FINGERPRINT_COMMAND })"
        />
        <div />
      </div>

      <div>
        <UiButton
          variant="tertiary"
          accent="brand"
          size="small"
          :left-icon="showAdvanced ? 'fa:chevron-up' : 'fa:chevron-down'"
          @click="showAdvanced = !showAdvanced"
        >
          {{ t('advanced-settings') }}
        </UiButton>
      </div>
      <div v-if="showAdvanced" class="row">
        <DockerTextInput
          v-bind="socketPathInputBindings"
          :info="t('docker-socket-path-info', { path: ROOTLESS_SOCKET_PATH })"
        />
        <div />
      </div>

      <UiAlert v-if="hostKeyError?.code === 'HOST_KEY_UNKNOWN'" accent="warning" class="host-key-alert">
        {{ t('docker-host-key-fingerprint-unknown') }}
        <template #description>
          <div class="host-key-details">
            <VtsCodeSnippet :content="hostKeyError.fingerprint" copy />
            <span>{{ t('docker-host-key-fingerprint-check', { command: FINGERPRINT_COMMAND }) }}</span>
            <div>
              <UiButton variant="primary" accent="brand" size="medium" :busy="isRunning" @click="trustHostKey()">
                {{ t('action:trust-host-key') }}
              </UiButton>
            </div>
          </div>
        </template>
      </UiAlert>

      <UiAlert v-else-if="hostKeyError?.code === 'HOST_KEY_MISMATCH'" accent="danger" class="host-key-alert">
        {{ t('docker-host-key-fingerprint-mismatch') }}
        <template #description>
          <div class="host-key-details">
            <span>{{ t('docker-host-key-expected') }}</span>
            <VtsCodeSnippet :content="hostKeyError.expected" />
            <span>{{ t('docker-host-key-presented') }}</span>
            <VtsCodeSnippet :content="hostKeyError.actual" copy />
          </div>
        </template>
      </UiAlert>

      <UiAlert v-else-if="saveError !== undefined" accent="danger" class="host-key-alert">
        {{ t('docker-connection-failed') }}
        <template #description>{{ saveError }}</template>
      </UiAlert>

      <div class="buttons-container">
        <UiButton v-if="isEditing" variant="secondary" accent="brand" size="medium" @click="emit('cancel')">
          {{ t('cancel') }}
        </UiButton>
        <UiButton type="submit" variant="primary" accent="brand" size="medium" :busy="isRunning">
          {{ t('connect') }}
        </UiButton>
      </div>
    </VtsForm>
  </UiCard>
</template>

<script lang="ts" setup>
import DockerAddressField from '@/modules/docker/components/form/connection/inputs/DockerAddressField.vue'
import DockerPortInput from '@/modules/docker/components/form/connection/inputs/DockerPortInput.vue'
import DockerPrivateKeyTextarea from '@/modules/docker/components/form/connection/inputs/DockerPrivateKeyTextarea.vue'
import DockerTextInput from '@/modules/docker/components/form/connection/inputs/DockerTextInput.vue'
import { useDockerErrorMessage } from '@/modules/docker/composables/use-docker-error-message.composable.ts'
import { useDockerConnectionForm } from '@/modules/docker/form/connection/use-docker-connection-form.ts'
import type { DockerConnectionSaveRequest } from '@/modules/docker/jobs/xo-docker-args.ts'
import { useXoDockerConnectionSaveJob } from '@/modules/docker/jobs/xo-docker-connection-save.job.ts'
import type { DockerHostKeyErrorData, FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import { getHostKeyErrorData } from '@/modules/docker/utils/xo-docker.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsForm from '@core/components/form/VtsForm.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm, engine } = defineProps<{
  vm: FrontXoVm
  engine?: FrontXoDockerEngine
}>()

const emit = defineEmits<{
  saved: [engineId: FrontXoDockerEngine['id']]
  cancel: []
}>()

const FINGERPRINT_COMMAND = 'ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub'

const ROOTLESS_SOCKET_PATH = '/run/user/<uid>/docker.sock'

const { t } = useI18n()

const {
  formData,
  hasCandidateAddresses,
  isCustomHost,
  isEditing,
  replacePrivateKey,
  mustSendPrivateKey,
  addressSelectBindings,
  customHostInputBindings,
  portInputBindings,
  usernameInputBindings,
  privateKeyBindings,
  passphraseInputBindings,
  socketPathInputBindings,
  fingerprintInputBindings,
  validateAndBuildRequest,
  clearSecrets,
} = useDockerConnectionForm(
  () => vm,
  () => engine
)

const showAdvanced = ref(false)

const request = ref<DockerConnectionSaveRequest>()

const hostKeyError = ref<DockerHostKeyErrorData>()

const saveError = ref<string>()

const { getDockerErrorMessage } = useDockerErrorMessage()

const { run: save, isRunning } = useXoDockerConnectionSaveJob(request)

async function submit(nextRequest: DockerConnectionSaveRequest) {
  request.value = nextRequest
  hostKeyError.value = undefined
  saveError.value = undefined

  try {
    const engineId = await save()
    clearSecrets()
    request.value = undefined
    emit('saved', engineId)
  } catch (error) {
    hostKeyError.value = getHostKeyErrorData(error)

    if (hostKeyError.value === undefined) {
      // e.g. a 429 SSH_COOLDOWN: tells when to retry
      saveError.value = getDockerErrorMessage(error)
    }
  }
}

async function onSubmit() {
  const nextRequest = await validateAndBuildRequest()

  if (nextRequest !== undefined) {
    await submit(nextRequest)
  }
}

// TOFU: the user checked the fingerprint of the 409, it is verified again on connection
async function trustHostKey() {
  if (request.value === undefined || hostKeyError.value?.code !== 'HOST_KEY_UNKNOWN') {
    return
  }

  const { fingerprint } = hostKeyError.value
  formData.hostKeyFingerprint = fingerprint

  await submit({
    ...request.value,
    payload: { ...request.value.payload, hostKeyFingerprint: fingerprint },
  } as DockerConnectionSaveRequest)
}
</script>

<style lang="postcss" scoped>
.docker-connection-form {
  .description,
  .key-kept {
    color: var(--color-neutral-txt-secondary);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .row {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    @media (--medium-or-large) {
      flex-direction: row;
      gap: 8rem;
      max-width: 88rem;
    }
  }

  .host-key-alert {
    max-width: 88rem;
  }

  .host-key-details {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-block-start: 0.8rem;
  }

  .buttons-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2.4rem;
  }
}
</style>
