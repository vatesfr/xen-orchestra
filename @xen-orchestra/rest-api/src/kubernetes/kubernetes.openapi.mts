import { createLogger } from '@xen-orchestra/log'
import { OpenAPIV3 } from 'openapi-types'

import { AsyncCacheEntry, getFromAsyncCache } from '../helpers/cache.helper.mjs'
import { KUBERNETES_ACL_RULES } from './kubernetes.routes.mjs'
import { MaybePromise } from '../helpers/helper.type.mjs'
import { KubernetesService } from './kubernetes.service.mjs'
import {
  type CAPISpecFragment,
  findUnknownAclRules,
  mergeFragment,
  transformCAPISpec,
} from './kubernetes.openapi.helper.mjs'

const log = createLogger('xo:rest-api:kubernetes-openapi')

const CAPI_SPEC_CACHE_KEY = 'capiSpec'

export class KubernetesOpenApiService {
  #kubernetesService: KubernetesService
  #cache = new Map<string, AsyncCacheEntry<MaybePromise<CAPISpecFragment>>>()
  #lastUnknownAclEndpoints: string | undefined

  constructor(kubernetesService: KubernetesService) {
    this.#kubernetesService = kubernetesService
  }

  /**
   * Completes XO's specification with CAPI's own specification
   */
  async apply(targetSpec: OpenAPIV3.Document): Promise<void> {
    const result = await getFromAsyncCache(
      this.#cache,
      CAPI_SPEC_CACHE_KEY,
      async () => transformCAPISpec(await this.#kubernetesService.getCAPISpec(), KUBERNETES_ACL_RULES),
      {
        expiresIn: 10 * 60 * 1e3,
        timeout: 5e3,
      }
    )

    if (result?.value === undefined) {
      return
    }

    mergeFragment(targetSpec, result.value)

    this.#logUnknownAclEndpoints(result.value)
  }

  /**
   * The rules are logged only when they change, as the specification is applied on every
   * request made to the documentation
   */
  #logUnknownAclEndpoints({ paths }: CAPISpecFragment): void {
    const unknownRules = findUnknownAclRules(paths, KUBERNETES_ACL_RULES)

    const endpoints = unknownRules.map(({ endpoint, method }) => `${method.toUpperCase()} ${endpoint}`).join(', ')
    if (endpoints === this.#lastUnknownAclEndpoints) {
      return
    }
    this.#lastUnknownAclEndpoints = endpoints

    if (unknownRules.length > 0) {
      log.warn('privileges are declared for kubernetes endpoints which do not exist and are therefore never used', {
        endpoints,
      })
    }
  }
}
