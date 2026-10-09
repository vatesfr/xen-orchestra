import { computed, type MaybeRefOrGetter, toValue } from 'vue'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * A 403 `featureUnauthorized` of the REST API (the XOA plan does not include
 * the feature), as a remote resource reports it: `cause: { status, body }`
 */
export function isFeatureUnauthorizedError(error: Error | undefined): boolean {
  const cause = error?.cause

  return isRecord(cause) && cause.status === 403 && isRecord(cause.body) && cause.body.error === 'feature Unauthorized'
}

/**
 * The one place telling what the Docker integration can do here, from what the
 * API answered when reading the engines.
 *
 * Only the XOA plan for now: the tab stays visible (discovery) and tells why
 * Docker is unavailable instead of showing a generic error.
 */
export function useDockerCapability(engineFetchError: MaybeRefOrGetter<Error | undefined>) {
  const isDockerUnavailableWithPlan = computed(() => isFeatureUnauthorizedError(toValue(engineFetchError)))

  return { isDockerUnavailableWithPlan }
}
