import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { configure } from '@xen-orchestra/log/configure'
import createMemoryTransport from '@xen-orchestra/log/transports/memory'

import { KubernetesEventService } from './kubernetes.event.mjs'
import type { KubernetesService } from './kubernetes.service.mjs'

// the logs are kept in memory instead of being printed while the tests run
configure({ level: 'WARN', transport: createMemoryTransport() })

// each service registers a handler on `SIGTERM` to stop its watcher: the tests create
// many of them, which node would report as a leak
process.setMaxListeners(0)

const encoder = new TextEncoder()

const CLUSTER = { id: 'cluster-1', name: 'first', phase: 'Provisioned' }
const OTHER_CLUSTER = { id: 'cluster-2', name: 'second', phase: 'Provisioned' }
const NODE = { id: 'node-1', name: 'first-node', $cluster: 'cluster-1' }

const sseFrame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

// the kubernetes API sends its objects in an envelope which identifies them, nested under
// a key named after their kind
const clusterFrame = (action: string, cluster: { id: string; name?: string }) =>
  sseFrame(`cluster.${action}`, {
    observed_at: '2026-10-26T10:00:00Z',
    namespace: 'default',
    id: cluster.id,
    name: cluster.name,
    cluster,
  })

type Emission = { collection: string; type: string; object: unknown; previous: unknown }

async function waitFor(predicate: () => boolean, message: string, timeout = 1000) {
  const deadline = Date.now() + timeout

  while (!predicate()) {
    if (Date.now() > deadline) {
      assert.fail(message)
    }

    await delay(5)
  }
}

// A service whose event stream is driven by the test: `send` pushes raw SSE frames into
// the stream the watcher is currently reading, and `endStream` ends it, which makes the
// watcher reconnect
function createWatcher({ clusters = [], nodes = [] }: { clusters?: unknown[]; nodes?: unknown[] } = {}) {
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined

  const state = { clusters, nodes, openCount: 0, paths: [] as string[] }

  const kubernetesService = {
    listClusters: async () => state.clusters,
    listNodes: async () => state.nodes,
    openEventStream: async (path: string, { signal }: { signal: AbortSignal }) => {
      state.paths.push(path)
      state.openCount++

      return new ReadableStream<Uint8Array>({
        start(streamController) {
          controller = streamController

          // mimics the body of the request being destroyed when the watcher stops
          signal.addEventListener('abort', () => {
            try {
              streamController.close()
            } catch {
              // the stream has already been ended by the test
            }
          })
        },
      })
    },
  }

  const service = new KubernetesEventService(kubernetesService as unknown as KubernetesService)

  const emissions: Emission[] = []
  const detach: Array<() => void> = []

  // the watcher starts as soon as a collection has a listener
  for (const collection of ['kubernetes-cluster', 'kubernetes-node'] as const) {
    const emitter = service.emitterFor(collection)

    for (const type of ['add', 'update', 'remove'] as const) {
      const handler = (object: unknown, previous: unknown) => {
        emissions.push({ collection, type, object, previous })
      }

      emitter.on(type, handler)
      detach.push(() => emitter.off(type, handler))
    }
  }

  return {
    emissions,
    service,
    state,

    send: (...frames: string[]) => {
      for (const frame of frames) {
        controller!.enqueue(encoder.encode(frame))
      }
    },

    endStream: () => {
      controller!.close()
      controller = undefined
    },

    // removing the last listener stops the watcher
    stop: () => detach.forEach(off => off()),
  }
}

let watcher: ReturnType<typeof createWatcher> | undefined

afterEach(() => {
  watcher?.stop()
  watcher = undefined
})

async function startWatcher(options?: { clusters?: unknown[]; nodes?: unknown[] }) {
  const started = (watcher = createWatcher(options))

  await waitFor(() => started.state.openCount === 1, 'the event stream has not been opened')

  return started
}

describe('KubernetesEventService#emitterFor', () => {
  const service = () => new KubernetesEventService({} as unknown as KubernetesService)

  it('returns the same emitter for a collection', () => {
    const kubernetesEventService = service()

    assert.equal(
      kubernetesEventService.emitterFor('kubernetes-cluster'),
      kubernetesEventService.emitterFor('kubernetes-cluster')
    )
  })

  it('returns a distinct emitter for each collection', () => {
    const kubernetesEventService = service()

    assert.notEqual(
      kubernetesEventService.emitterFor('kubernetes-cluster'),
      kubernetesEventService.emitterFor('kubernetes-node')
    )
  })

  it('throws for a collection which is not watched', () => {
    assert.throws(() => service().emitterFor('kubernetes-pool' as 'kubernetes-node'), /no emitter/)
  })
})

describe('the events of the kubernetes API', () => {
  it('opens a single stream for every collection', async () => {
    const watcher = await startWatcher()

    assert.deepEqual(watcher.state.paths, ['kubernetes/events'])
  })

  it('emits an add when an object is created', async () => {
    const watcher = await startWatcher()

    watcher.send(clusterFrame('created', CLUSTER))

    await waitFor(() => watcher.emissions.length === 1, 'the created cluster has not been emitted')
    assert.deepEqual(watcher.emissions, [
      { collection: 'kubernetes-cluster', type: 'add', object: CLUSTER, previous: undefined },
    ])
  })

  it('emits an update with the previous version of the object', async () => {
    const watcher = await startWatcher()
    const updated = { ...CLUSTER, phase: 'Running' }

    watcher.send(clusterFrame('created', CLUSTER), clusterFrame('updated', updated))

    await waitFor(() => watcher.emissions.length === 2, 'the updated cluster has not been emitted')
    assert.deepEqual(watcher.emissions[1], {
      collection: 'kubernetes-cluster',
      type: 'update',
      object: updated,
      previous: CLUSTER,
    })
  })

  it('emits a remove with the last known version of the object', async () => {
    const watcher = await startWatcher()

    // the object of a deleted event is not sent by the kubernetes API
    watcher.send(clusterFrame('created', CLUSTER), sseFrame('cluster.deleted', { id: CLUSTER.id, name: CLUSTER.name }))

    await waitFor(() => watcher.emissions.length === 2, 'the deleted cluster has not been emitted')
    assert.deepEqual(watcher.emissions[1], {
      collection: 'kubernetes-cluster',
      type: 'remove',
      object: undefined,
      previous: CLUSTER,
    })
  })

  it('forgets a deleted object', async () => {
    const watcher = await startWatcher()
    const deleted = sseFrame('cluster.deleted', { id: CLUSTER.id })

    watcher.send(clusterFrame('created', CLUSTER), deleted, deleted)

    await waitFor(() => watcher.emissions.length === 3, 'the deleted cluster has not been emitted twice')
    assert.deepEqual(watcher.emissions[2], {
      collection: 'kubernetes-cluster',
      type: 'remove',
      object: undefined,
      previous: undefined,
    })
  })

  it('emits the events of a node on its own collection', async () => {
    const watcher = await startWatcher()

    watcher.send(sseFrame('node.created', { id: NODE.id, name: NODE.name, node: NODE }))

    await waitFor(() => watcher.emissions.length === 1, 'the created node has not been emitted')
    assert.deepEqual(watcher.emissions, [
      { collection: 'kubernetes-node', type: 'add', object: NODE, previous: undefined },
    ])
  })

  describe('ignores', () => {
    // the events are handled in the order they are received: a known event sent after the
    // ignored ones tells that they have been handled
    const assertIgnored = async (...frames: string[]) => {
      const watcher = await startWatcher()

      watcher.send(...frames, clusterFrame('created', OTHER_CLUSTER))

      await waitFor(() => watcher.emissions.length > 0, 'nothing has been emitted at all')
      assert.deepEqual(watcher.emissions, [
        { collection: 'kubernetes-cluster', type: 'add', object: OTHER_CLUSTER, previous: undefined },
      ])
    }

    it('the heartbeats', () => assertIgnored(sseFrame('ping', {})))

    it('the errors of the stream', () => assertIgnored(sseFrame('error', { detail: 'something went wrong' })))

    it('the events of an object which is not exposed by XO', () =>
      assertIgnored(sseFrame('machine.created', { id: 'machine-1', machine: { id: 'machine-1' } })))

    it('the events which do not carry their object', () =>
      // `cluster.kubeconfig.available` only describes a change of context
      assertIgnored(sseFrame('cluster.kubeconfig.available', { id: CLUSTER.id, context: 'admin@first' })))

    it('the events whose object has no identifier', () => assertIgnored(sseFrame('cluster.created', { cluster: {} })))

    it('the events which are not named after an object', () => assertIgnored(sseFrame('shutdown', { id: CLUSTER.id })))
  })
})

describe('the resynchronisation of the collections', () => {
  it('records the objects of the first connection without emitting them', async () => {
    const watcher = await startWatcher({ clusters: [CLUSTER], nodes: [NODE] })

    // nothing is emitted for the objects which are fetched on the first connection, but
    // they are known: the deletion of one of them carries its last known version
    watcher.send(sseFrame('cluster.deleted', { id: CLUSTER.id }))

    await waitFor(() => watcher.emissions.length === 1, 'the deleted cluster has not been emitted')
    assert.deepEqual(watcher.emissions, [
      { collection: 'kubernetes-cluster', type: 'remove', object: undefined, previous: CLUSTER },
    ])
  })

  it('emits the changes which happened while the stream was interrupted', async () => {
    const watcher = await startWatcher({ clusters: [CLUSTER, OTHER_CLUSTER] })
    const updated = { ...OTHER_CLUSTER, phase: 'Running' }
    const created = { id: 'cluster-3', name: 'third' }

    // while disconnected, a cluster has been deleted, another has changed and a third one
    // has appeared
    watcher.state.clusters = [updated, created]
    watcher.endStream()

    await waitFor(() => watcher.state.openCount === 2, 'the watcher has not reconnected', 5000)
    await waitFor(() => watcher.emissions.length === 3, 'the differences have not been emitted')

    assert.deepEqual(watcher.emissions, [
      { collection: 'kubernetes-cluster', type: 'update', object: updated, previous: OTHER_CLUSTER },
      { collection: 'kubernetes-cluster', type: 'add', object: created, previous: undefined },
      { collection: 'kubernetes-cluster', type: 'remove', object: undefined, previous: CLUSTER },
    ])
  })

  it('keeps handling the events after a reconnection', async () => {
    const watcher = await startWatcher()

    watcher.endStream()

    await waitFor(() => watcher.state.openCount === 2, 'the watcher has not reconnected', 5000)

    watcher.send(clusterFrame('created', CLUSTER))

    await waitFor(() => watcher.emissions.length === 1, 'the created cluster has not been emitted')
    assert.deepEqual(watcher.emissions, [
      { collection: 'kubernetes-cluster', type: 'add', object: CLUSTER, previous: undefined },
    ])
  })
})
