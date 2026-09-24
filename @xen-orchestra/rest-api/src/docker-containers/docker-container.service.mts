import * as CM from 'complex-matcher'
import { inject } from 'inversify'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import type {
  XoDockerContainer,
  XoDockerContainerAction,
  XoDockerContainerListError,
  XoDockerEngine,
  XoDockerLogs,
} from '@vates/types'

import { RestApi } from '../rest-api/rest-api.mjs'
import { withDockerErrors } from '../helpers/docker.helper.mjs'
import { safeParseComplexMatcher } from '../helpers/utils.helper.mjs'

const DEFAULT_MAX_LISTED_ENGINES = 10

// properties of the containers which designate their engine(s)
const SCOPE_PROPERTIES = ['$engine', '$VM', '$pool'] as const
type ScopeProperty = (typeof SCOPE_PROPERTIES)[number]

type EnginePredicate = (engine: XoDockerEngine) => boolean

const getScopeValue = (engine: XoDockerEngine, property: ScopeProperty): string | undefined =>
  property === '$engine' ? engine.id : engine[property]

// values of an equality term: `foo`, `"foo"`, or `|(foo bar)`
function getEqualityValues(node: CM.Node): string[] | undefined {
  if (node instanceof CM.StringNode || node instanceof CM.NumberOrStringNode) {
    return [node.value]
  }
  if (node instanceof CM.Or) {
    const values: string[] = []
    for (const child of node.children) {
      const childValues = getEqualityValues(child)
      if (childValues === undefined) {
        return
      }
      values.push(...childValues)
    }
    return values
  }
}

/**
 * Engines designated by the equality terms on `$engine`, `$VM` or `$pool` of
 * a filter, as a predicate.
 *
 * The designated engines are a superset of the engines of the containers
 * matching the filter (which is applied afterwards anyway): terms which cannot
 * be interpreted (patterns, negations…) are ignored in a conjunction, and make
 * a disjunction unscoped.
 *
 * @returns `undefined` if the filter does not designate engines
 */
export function getEngineScope(node: CM.Node): EnginePredicate | undefined {
  if (node instanceof CM.Property) {
    if (!(SCOPE_PROPERTIES as readonly string[]).includes(node.name)) {
      return
    }
    const property = node.name as ScopeProperty
    const values = getEqualityValues(node.child)?.map(value => value.toLowerCase())
    if (values === undefined) {
      return
    }
    return engine => {
      const value = getScopeValue(engine, property)
      return value !== undefined && values.includes(value.toLowerCase())
    }
  }
  if (node instanceof CM.And) {
    const predicates = node.children.map(getEngineScope).filter(_ => _ !== undefined)
    return predicates.length === 0 ? undefined : engine => predicates.every(predicate => predicate(engine))
  }
  if (node instanceof CM.Or) {
    const predicates = node.children.map(getEngineScope)
    return predicates.some(_ => _ === undefined)
      ? undefined
      : engine => predicates.some(predicate => predicate!(engine))
  }
}

export type DockerContainerList = {
  containers: XoDockerContainer[]
  errors: XoDockerContainerListError[]
}

/**
 * Containers of the Docker engines, fetched live through xo-server's pool
 * (and cached there, see `docker.cacheExpiresIn`: not cached again here).
 */
export class DockerContainerService {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    this.#restApi = restApi
  }

  get #maxListedEngines(): number {
    return this.#restApi.xoApp.config.getOptional<number>('docker.maxListedEngines') ?? DEFAULT_MAX_LISTED_ENGINES
  }

  /**
   * Engines designated by a filter, without any connection.
   *
   * @throws invalidParameters if the filter does not designate engines, or too many
   */
  async resolveEngines(filter: string | undefined): Promise<XoDockerEngine['id'][]> {
    const scope = filter === undefined ? undefined : getEngineScope(safeParseComplexMatcher(filter))
    if (scope === undefined) {
      throw invalidParameters('filter on $engine, $VM or $pool is required (e.g. filter=$VM:<VM uuid>)')
    }
    const engines = (await this.#restApi.xoApp.getAllDockerEngines()).filter(scope).map(engine => engine.id)
    const max = this.#maxListedEngines
    if (engines.length > max) {
      throw invalidParameters(
        `the filter designates ${engines.length} Docker engines, at most ${max} are allowed (docker.maxListedEngines)`
      )
    }
    return engines
  }

  /**
   * Scoped listing: the engines designated by the filter are listed
   * concurrently, then the whole filter is applied.
   *
   * An engine which fails does not fail the list: see `errors`.
   */
  async list({
    filter,
    all = true,
    stats = false,
    forceRefresh = false,
  }: {
    filter?: string
    all?: boolean
    stats?: boolean
    forceRefresh?: boolean
  }): Promise<DockerContainerList> {
    const engines = await this.resolveEngines(filter)
    const { containers, errors } = await withDockerErrors(() =>
      this.#restApi.xoApp.getDockerContainers({ engines, all, stats, forceRefresh })
    )
    const predicate = safeParseComplexMatcher(filter!).createPredicate()
    return { containers: containers.filter(predicate), errors }
  }

  /**
   * Check the composite id and the existence of its engine, without any
   * connection.
   *
   * @throws noSuchObject
   */
  async assertContainerId(id: XoDockerContainer['id']): Promise<void> {
    const index = id.indexOf('_')
    if (index === -1 || !/^[0-9a-f]{64}$/.test(id.slice(index + 1))) {
      throw noSuchObject(id, 'docker-container')
    }
    try {
      await this.#restApi.xoApp.getDockerEngine(id.slice(0, index) as XoDockerEngine['id'])
    } catch (error) {
      throw noSuchObject.is(error) ? noSuchObject(id, 'docker-container') : error
    }
  }

  getContainer(id: XoDockerContainer['id']): Promise<XoDockerContainer> {
    return withDockerErrors(() => this.#restApi.xoApp.getDockerContainer(id))
  }

  getLogs(
    id: XoDockerContainer['id'],
    opts: {
      tail?: number
      since?: string
      until?: string
      stdout?: boolean
      stderr?: boolean
      timestamps?: boolean
    }
  ): Promise<XoDockerLogs> {
    // a number of milliseconds or a date string
    const toDate = (value: string | undefined) =>
      value !== undefined && /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : value
    return withDockerErrors(() =>
      this.#restApi.xoApp.getDockerContainerLogs(id, {
        ...opts,
        since: toDate(opts.since),
        until: toDate(opts.until),
      })
    )
  }

  runAction(id: XoDockerContainer['id'], action: XoDockerContainerAction): Promise<void> {
    return withDockerErrors(() => this.#restApi.xoApp.runDockerContainerAction(id, action))
  }

  delete(id: XoDockerContainer['id'], opts: { force?: boolean; removeVolumes?: boolean }): Promise<void> {
    return withDockerErrors(() => this.#restApi.xoApp.deleteDockerContainer(id, opts))
  }
}
