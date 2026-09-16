import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { ObjectState, ObjectType } from '@core/icons'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import { mount, type DOMWrapper } from '@vue/test-utils'

type QueryableWrapper = Pick<DOMWrapper<Element>, 'findAll'>

/**
 * An icon renders as bare `<svg>` paths, so the only way to name the one a
 * component picked is to compare it with a reference render of the icon it was
 * meant to pick — the rendering counterpart of asserting `objectIcon(…)`.
 */
export function findIconPaths(wrapper: QueryableWrapper) {
  return wrapper.findAll('.icon-path').map(path => path.attributes('d'))
}

/**
 * The paths {@link findIconPaths} reads from the icon of an object in a given
 * state, rendered on its own — the reference to compare a component against.
 */
export function findObjectIconPaths<TType extends ObjectType>(type: TType, state: ObjectState<TType>) {
  const wrapper = mount(VtsObjectIcon, {
    props: { type, state, size: 'medium' as const },
    global: createGlobalTestConfig(),
  })

  return findIconPaths(wrapper)
}
