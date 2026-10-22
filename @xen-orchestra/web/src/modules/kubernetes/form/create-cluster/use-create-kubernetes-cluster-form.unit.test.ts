import {
  DESCRIPTION_MAX_LENGTH,
  useCreateKubernetesClusterForm,
} from '@/modules/kubernetes/form/create-cluster/use-create-kubernetes-cluster-form.ts'
import { useKubernetesVersionOptions } from '@/modules/kubernetes/form/create-cluster/use-kubernetes-version-options.ts'
import type {
  KubernetesReleaseGroup,
  useXoKubernetesReleaseCollection,
} from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-release-collection.ts'
import {
  buildKubernetesClusterCreatePayload,
  type CreateKubernetesClusterFormData,
  kubernetesClusterToFormData,
} from '@/modules/kubernetes/utils/kubernetes-cluster-form.util.ts'
import { createKubernetesCluster } from '@/test/create-kubernetes-cluster.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { kubernetesReleaseGroups, useReleaseCollection } = vi.hoisted(() => {
  const kubernetesReleaseGroups = { value: [] as KubernetesReleaseGroup[] }

  return {
    kubernetesReleaseGroups,
    useReleaseCollection: vi.fn(() => ({ kubernetesReleaseGroups, areKubernetesReleasesReady: { value: true } })),
  }
})

vi.mock(import('@/modules/kubernetes/remote-resources/use-xo-kubernetes-release-collection.ts'), () => ({
  useXoKubernetesReleaseCollection: useReleaseCollection as unknown as typeof useXoKubernetesReleaseCollection,
}))

beforeEach(() => {
  kubernetesReleaseGroups.value = [
    { version: '1.37', releases: ['1.37.1'] },
    { version: '1.36', releases: ['1.36.5'] },
  ]
  useReleaseCollection.mockClear()
})

const clusterVersions = [{ replicas: 1, version: 'v1.36.5' }]

const editedCluster = createKubernetesCluster({
  control_plane_status: { ...createKubernetesCluster().control_plane_status, versions: clusterVersions },
  worker_status: { ...createKubernetesCluster().worker_status, desired_replicas: 2, versions: clusterVersions },
})

type ValidCreateKubernetesClusterFormData = CreateKubernetesClusterFormData & { kubernetes_version: string }

function createFormData(
  overrides: Partial<ValidCreateKubernetesClusterFormData> = {}
): ValidCreateKubernetesClusterFormData {
  return {
    name: 'prod-cluster',
    description: '',
    tagsRaw: '',
    control_plane_replicas: 1,
    worker_replicas: 2,
    control_plane_ip: '10.0.0.1',
    vm_name_prefix: 'k8s-',
    kubernetes_version: '1.36.5',
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
      control_plane_replicas: 1,
      worker_replicas: 2,
      control_plane_ip: '10.0.0.1',
      vm_name_prefix: 'k8s-',
      kubernetes_version: '1.36.5',
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
      control_plane_replicas: 1,
      worker_replicas: 2,
      control_plane_ip: '10.0.0.1',
      vm_name_prefix: 'k8s-',
      kubernetes_version: '1.37.1',
    })
  })

  it('builds no payload when no Kubernetes release is available', async () => {
    kubernetesReleaseGroups.value = []

    const result = mountCreateKubernetesClusterForm()

    fillValidForm(result)

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
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

  it('builds no payload when description exceeds the max length', async () => {
    const result = mountCreateKubernetesClusterForm()

    fillValidForm(result)
    updateField(result.descriptionInputBindings, 'a'.repeat(DESCRIPTION_MAX_LENGTH + 1))

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })
})

describe('kubernetesClusterToFormData', () => {
  it('prefills the Kubernetes version with the cluster version', () => {
    expect(kubernetesClusterToFormData(editedCluster)).toEqual(
      expect.objectContaining({ kubernetes_version: 'v1.36.5' })
    )
  })
})

describe('edit mode', () => {
  function mountEditKubernetesClusterForm() {
    return mountComposable(() => useCreateKubernetesClusterForm(editedCluster)).wrapper.vm
  }

  it('does not fetch the available Kubernetes releases', () => {
    mountEditKubernetesClusterForm()

    expect(useReleaseCollection).not.toHaveBeenCalled()
  })

  it('builds the edit payload without requiring a Kubernetes release', async () => {
    kubernetesReleaseGroups.value = []

    const result = mountEditKubernetesClusterForm()

    await expect(result.validateAndBuildEditPayload()).resolves.toEqual({
      description: '',
      control_plane_replicas: 1,
      worker_replicas: 2,
    })
  })
})

describe('useKubernetesVersionOptions', () => {
  it('groups the releases by minor version', () => {
    kubernetesReleaseGroups.value = [
      { version: '1.37', releases: ['1.37.1', '1.37.0'] },
      { version: '1.36', releases: ['1.36.5'] },
    ]

    const { options } = mountComposable(() => useKubernetesVersionOptions()).wrapper.vm

    expect(options).toEqual([
      { value: '1.37.1', label: 'v1.37.1', group: 'v1.37' },
      { value: '1.37.0', label: 'v1.37.0', group: 'v1.37' },
      { value: '1.36.5', label: 'v1.36.5', group: 'v1.36' },
    ])
  })

  it('does not group the current version in edit mode', () => {
    const { options } = mountComposable(() => useKubernetesVersionOptions(editedCluster)).wrapper.vm

    expect(options).toEqual([{ value: 'v1.36.5', label: 'v1.36.5' }])
  })
})
