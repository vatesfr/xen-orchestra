import { computed, type MaybeRefOrGetter, type Ref, toValue } from 'vue'

/**
 * What `getXById` of a remote-resource collection answers, for the mocked collections of `src/test/mock-xo-*.ts`.
 */
export function findById<TRecord extends { id: string }>(records: TRecord[], id: TRecord['id'] | undefined) {
  return records.find(record => record.id === id)
}

/**
 * What `getXsByIds` of a remote-resource collection answers, for the mocked collections of `src/test/mock-xo-*.ts`:
 * the records in collection order.
 */
export function filterByIds<TRecord extends { id: string }>(records: TRecord[], ids: TRecord['id'][] | undefined) {
  const idSet = new Set(ids)

  return records.filter(record => idSet.has(record.id))
}

/**
 * A mocked remote-resource collection answering from `records`: the records as `<xs>`, `are<Xs>Ready` when given,
 * and `get<X>ById`, `useGet<X>ById`, `get<Xs>ByIds`, `useGet<Xs>ByIds`. Spread it into the mocked collection,
 * beside what that collection adds.
 */
export function createMockCollection<TRecord extends { id: string }>(
  singular: string,
  plural: string,
  records: Readonly<Ref<TRecord[]>>,
  isReady?: Ref<boolean>
) {
  return {
    [plural.charAt(0).toLowerCase() + plural.slice(1)]: records,
    ...(isReady !== undefined && { [`are${plural}Ready`]: isReady }),
    [`get${singular}ById`]: (id: TRecord['id'] | undefined) => findById(records.value, id),
    [`useGet${singular}ById`]: (id: MaybeRefOrGetter<TRecord['id'] | undefined>) =>
      computed(() => findById(records.value, toValue(id))),
    [`get${plural}ByIds`]: (ids: TRecord['id'][] | undefined) => filterByIds(records.value, ids),
    [`useGet${plural}ByIds`]: (ids: MaybeRefOrGetter<TRecord['id'][] | undefined>) =>
      computed(() => filterByIds(records.value, toValue(ids))),
  }
}
