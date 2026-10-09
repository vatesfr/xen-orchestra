import {
  isValidKubernetesTagsString,
  kubernetesTagsToStrings,
  parseKubernetesTagsString,
} from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'

describe('parseKubernetesTagsString', () => {
  it.each(['', '   '])('returns undefined for empty input %j', tagsRaw => {
    expect(parseKubernetesTagsString(tagsRaw)).toBeUndefined()
  })

  it('parses a single key=value pair', () => {
    expect(parseKubernetesTagsString('env=prod')).toEqual({ env: 'prod' })
  })

  it('parses multiple comma-separated pairs', () => {
    expect(parseKubernetesTagsString('env=prod,team=infra')).toEqual({
      env: 'prod',
      team: 'infra',
    })
  })

  it('trims whitespace around pairs', () => {
    expect(parseKubernetesTagsString('env=prod, team=infra')).toEqual({
      env: 'prod',
      team: 'infra',
    })
  })

  it('ignores empty segments between commas', () => {
    expect(parseKubernetesTagsString('env=prod,,team=infra')).toEqual({
      env: 'prod',
      team: 'infra',
    })
  })

  it('uses the last value when keys are duplicated', () => {
    expect(parseKubernetesTagsString('a=1,a=2')).toEqual({ a: '2' })
  })

  it.each(['env', '=value', 'key='])('throws for invalid syntax %j', tagsRaw => {
    expect(() => parseKubernetesTagsString(tagsRaw)).toThrow('invalid-kubernetes-tags')
  })

  it.each(['key = value', 'ke y=va lue', 'key=va lue', 'ke y=value'])(
    'throws when key or value contains internal whitespace %j',
    tagsRaw => {
      expect(() => parseKubernetesTagsString(tagsRaw)).toThrow('invalid-kubernetes-tags')
    }
  )
})

describe('isValidKubernetesTagsString', () => {
  it('returns true for valid syntax', () => {
    expect(isValidKubernetesTagsString('env=prod,team=infra')).toBe(true)
  })

  it.each(['env', 'ke y=va lue'])('returns false for invalid syntax %j', tagsRaw => {
    expect(isValidKubernetesTagsString(tagsRaw)).toBe(false)
  })
})

describe('kubernetesTagsToStrings', () => {
  it('returns an empty array for null tags', () => {
    expect(kubernetesTagsToStrings(null)).toEqual([])
  })

  it('formats key-value pairs as "key: value"', () => {
    expect(kubernetesTagsToStrings({ env: 'prod' })).toEqual(['env: prod'])
  })

  it('returns the key alone when the value is empty', () => {
    expect(kubernetesTagsToStrings({ solo: '' })).toEqual(['solo'])
  })
})
