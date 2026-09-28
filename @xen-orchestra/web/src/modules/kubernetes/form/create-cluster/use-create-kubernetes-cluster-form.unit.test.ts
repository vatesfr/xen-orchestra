import {
  buildKubernetesClusterCreatePayload,
  useCreateKubernetesClusterForm,
} from '@/modules/kubernetes/form/create-cluster/use-create-kubernetes-cluster-form.ts'
import type { CreateKubernetesClusterFormData } from '@/modules/kubernetes/form/create-cluster/use-create-kubernetes-cluster-form.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function createFormData(overrides: Partial<CreateKubernetesClusterFormData> = {}): CreateKubernetesClusterFormData {
  return {
    name: 'prod-cluster',
    description: '',
    tagsRaw: '',
    controlPlaneReplicas: 1,
    workerReplicas: 2,
    controlPlaneIP: '10.0.0.1',
    vmNamePrefix: 'k8s-',
    ...overrides,
  }
}

function mountCreateKubernetesClusterForm() {
  return mountComposable(() => useCreateKubernetesClusterForm()).wrapper.vm
}

function updateField<T>(binding: { 'onUpdate:modelValue': (value: T) => void }, value: T) {
  binding['onUpdate:modelValue'](value)
}

function fillValidForm(result: ReturnType<typeof mountCreateKubernetesClusterForm>) {
  updateField(result.nameInputBindings, 'prod-cluster')
  updateField(result.controlPlaneIPInputBindings, '10.0.0.1')
  updateField(result.vmNamePrefixInputBindings, 'k8s-')
  updateField(result.controlPlaneReplicasInputBindings, 1)
  updateField(result.workerReplicasInputBindings, 2)
}

describe('buildKubernetesClusterCreatePayload', () => {
  it('builds the required payload fields', () => {
    expect(buildKubernetesClusterCreatePayload(createFormData())).toEqual({
      name: 'prod-cluster',
      controlPlaneReplicas: 1,
      workerReplicas: 2,
      controlPlaneIP: '10.0.0.1',
      vmNamePrefix: 'k8s-',
    })
  })

  it('omits description when it is empty', () => {
    expect(buildKubernetesClusterCreatePayload(createFormData({ description: '' }))).not.toHaveProperty('description')
  })

  it('includes description when it is set', () => {
    expect(buildKubernetesClusterCreatePayload(createFormData({ description: 'Production cluster' }))).toEqual(
      expect.objectContaining({ description: 'Production cluster' })
    )
  })

  it('omits tags when tagsRaw is empty', () => {
    expect(buildKubernetesClusterCreatePayload(createFormData({ tagsRaw: '' }))).not.toHaveProperty('tags')
  })

  it('parses and includes tags when tagsRaw is valid', () => {
    expect(buildKubernetesClusterCreatePayload(createFormData({ tagsRaw: 'env=prod,team=infra' }))).toEqual(
      expect.objectContaining({ tags: { env: 'prod', team: 'infra' } })
    )
  })
})

describe('validateAndBuildPayload', () => {
  it('builds a payload from valid form data', async () => {
    const result = mountCreateKubernetesClusterForm()

    fillValidForm(result)
    updateField(result.descriptionInputBindings, 'Production cluster')
    updateField(result.tagsInputBindings, 'env=prod')

    await expect(result.validateAndBuildPayload()).resolves.toEqual({
      name: 'prod-cluster',
      description: 'Production cluster',
      tags: { env: 'prod' },
      controlPlaneReplicas: 1,
      workerReplicas: 2,
      controlPlaneIP: '10.0.0.1',
      vmNamePrefix: 'k8s-',
    })
  })

  it('builds no payload when the name is empty', async () => {
    const result = mountCreateKubernetesClusterForm()

    fillValidForm(result)
    updateField(result.nameInputBindings, '')

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })

  it('builds no payload when the control plane IP is invalid', async () => {
    const result = mountCreateKubernetesClusterForm()

    fillValidForm(result)
    updateField(result.controlPlaneIPInputBindings, 'not-an-ip')

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })

  it('builds no payload when the VM name prefix is empty', async () => {
    const result = mountCreateKubernetesClusterForm()

    fillValidForm(result)
    updateField(result.vmNamePrefixInputBindings, '')

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })

  it('builds no payload when control plane replicas is below 1', async () => {
    const result = mountCreateKubernetesClusterForm()

    fillValidForm(result)
    updateField(result.controlPlaneReplicasInputBindings, 0)

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })

  it('builds no payload when tags syntax is invalid', async () => {
    const result = mountCreateKubernetesClusterForm()

    fillValidForm(result)
    updateField(result.tagsInputBindings, 'invalid-tag')

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })
})
