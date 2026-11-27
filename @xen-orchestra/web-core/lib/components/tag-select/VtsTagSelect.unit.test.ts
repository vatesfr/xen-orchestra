import VtsTag from '@core/components/tag/VtsTag.vue'
import VtsTagSelect, { type TagSelectSuggestion } from '@core/components/tag-select/VtsTagSelect.vue'
import VtsTagSelectOption from '@core/components/tag-select/VtsTagSelectOption.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { hasLoader } from '@core-test/expect-loader.ts'
import { findTagProps } from '@core-test/find-accented-labels.ts'
import { getButton, getUiButton } from '@core-test/get-button.ts'
import { t } from '@core-test/i18n.ts'
import { setViewportWidth } from '@core-test/set-viewport-width.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

const SUGGESTIONS: TagSelectSuggestion[] = [
  { tag: 'analytics', info: '1 VM' },
  { tag: 'db', info: '1 VM' },
  { tag: 'production', info: '2 VMs' },
  { tag: 'web', info: '1 VM' },
]

type TagSelectProps = {
  tags?: string[]
  suggestions?: TagSelectSuggestion[]
  iconOnly?: boolean
  busy?: boolean
}

function mountTagSelect({ tags = ['production', 'web'], suggestions = SUGGESTIONS, ...props }: TagSelectProps = {}) {
  return mount(VtsTagSelect, {
    props: { tags, suggestions, ...props },
    global: createGlobalTestConfig(),
  })
}

async function clickButton(wrapper: VueWrapper, label: string) {
  await getButton(wrapper, label).trigger('click')
  await flushPromises()
}

async function openTagSelect(wrapper: VueWrapper) {
  await flushPromises()
  await wrapper.get('.ui-button, .ui-button-icon').trigger('click')
  await flushPromises()
}

async function searchTag(wrapper: VueWrapper, search: string) {
  await wrapper.get('.search-container input').setValue(search)
  await flushPromises()
}

function findOptions(wrapper: VueWrapper) {
  return wrapper.findAllComponents(VtsTagSelectOption).map(option => ({
    tag: option.getComponent(VtsTag).props('value'),
    dropdown: option.getComponent(UiDropdown),
    element: option,
  }))
}

function findOptionTags(wrapper: VueWrapper) {
  return findOptions(wrapper).map(({ tag }) => tag)
}

function findCheckedOptionTags(wrapper: VueWrapper) {
  return findOptions(wrapper)
    .filter(({ dropdown }) => dropdown.props('selected'))
    .map(({ tag }) => tag)
}

async function clickTagOption(wrapper: VueWrapper, tag: string) {
  const option = findOptions(wrapper).find(option => option.tag === tag)

  if (option === undefined) {
    throw new Error(`No option for the tag "${tag}"`)
  }

  await option.element.trigger('click')
  await flushPromises()
}

function findCurrentTags(wrapper: VueWrapper) {
  return findTagProps(wrapper.get('.current-tags'), 'value')
}

async function removeCurrentTag(wrapper: VueWrapper, tag: string) {
  const currentTag = wrapper
    .findAllComponents(VtsTag)
    .find(currentTag => currentTag.element.closest('.current-tags') !== null && currentTag.props('value') === tag)

  if (currentTag === undefined) {
    throw new Error(`No current tag "${tag}"`)
  }

  await currentTag.get('button.remove').trigger('click')
  await flushPromises()
}

function findSavedChanges(wrapper: VueWrapper) {
  return wrapper.emitted('save')?.map(([changes]) => changes)
}

function isDropdownOpen(wrapper: VueWrapper) {
  return wrapper.find('.dropdown-list').exists()
}

const DEFAULT_VIEWPORT_WIDTH = 1024

describe('trigger', () => {
  it('offers to add tags when there are none', () => {
    const wrapper = mountTagSelect({ tags: [] })

    expect(() => getButton(wrapper, t('action:add'))).not.toThrow()
  })

  it('offers to edit the tags when there are some', () => {
    const wrapper = mountTagSelect()

    expect(() => getButton(wrapper, t('action:edit'))).not.toThrow()
  })

  it('renders an icon button labelled with its action when icon-only', () => {
    const wrapper = mountTagSelect({ iconOnly: true })

    expect(wrapper.findComponent(UiButton).exists()).toBe(false)
    expect(wrapper.getComponent(UiButtonIcon).attributes('aria-label')).toBe(t('action:edit'))
  })

  it('marks the text trigger as busy', () => {
    const wrapper = mountTagSelect({ busy: true })

    expect(getUiButton(wrapper, t('action:edit')).props('busy')).toBe(true)
  })

  it('disables the icon-only trigger and shows a loader when busy', () => {
    const wrapper = mountTagSelect({ iconOnly: true, busy: true })

    expect(wrapper.getComponent(UiButtonIcon).props('disabled')).toBe(true)
    expect(hasLoader(wrapper)).toBe(true)
  })

  it('shows no loader on the icon-only trigger when not busy', () => {
    const wrapper = mountTagSelect({ iconOnly: true })

    expect(wrapper.getComponent(UiButtonIcon).props('disabled')).toBe(false)
    expect(hasLoader(wrapper)).toBe(false)
  })
})

describe('options', () => {
  it('lists the tags and the suggestions in alphabetical order, with their info', async () => {
    const wrapper = mountTagSelect({ tags: ['web', 'custom'], suggestions: SUGGESTIONS.slice(0, 3) })

    await openTagSelect(wrapper)

    expect(findOptions(wrapper).map(({ tag, dropdown }) => [tag, dropdown.props('info')])).toEqual([
      ['analytics', '1 VM'],
      ['custom', undefined],
      ['db', '1 VM'],
      ['production', '2 VMs'],
      ['web', undefined],
    ])
  })

  it('checks the current tags', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)

    expect(findCheckedOptionTags(wrapper)).toEqual(['production', 'web'])
  })

  it('keeps the order of the tags while they are selected and deselected', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')

    expect(findOptionTags(wrapper)).toEqual(['analytics', 'db', 'production', 'web'])
    expect(findCheckedOptionTags(wrapper)).toEqual(['db', 'production'])
  })

  it('keeps listing a created tag once deselected', async () => {
    const wrapper = mountTagSelect({ suggestions: [] })

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'brand-new')
    await clickTagOption(wrapper, 'brand-new')
    await searchTag(wrapper, '')
    await clickTagOption(wrapper, 'brand-new')

    expect(findOptionTags(wrapper)).toEqual(['brand-new', 'production', 'web'])
    expect(findCheckedOptionTags(wrapper)).toEqual(['production', 'web'])
  })

  it('filters the tags on the search', async () => {
    const wrapper = mountTagSelect({ suggestions: [{ tag: 'production-eu' }, { tag: 'db' }] })

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'prod')

    expect(findOptionTags(wrapper)).toEqual(['prod', 'production', 'production-eu'])
  })

  it('does not offer the empty tag', async () => {
    const wrapper = mountTagSelect({ suggestions: [{ tag: '' }, { tag: 'db' }] })

    await openTagSelect(wrapper)

    expect(findOptionTags(wrapper)).toEqual(['db', 'production', 'web'])
  })

  it('explains how to create a scoped tag', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)

    expect(wrapper.get('.scoped-tag-hint').text()).toBe(t('scoped-tag-hint'))
  })
})

describe('creating a tag', () => {
  it('offers to create the trimmed searched tag when no tag matches it exactly', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await searchTag(wrapper, '  brand-new  ')

    const [createOption, ...otherOptions] = findOptions(wrapper)

    expect(createOption.tag).toBe('brand-new')
    expect(createOption.element.text()).toContain(t('action:create'))
    expect(otherOptions).toEqual([])
  })

  it('displays the tag to create with a "+" instead of a checkbox', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'brand-new')

    const [{ dropdown }] = findOptions(wrapper)

    expect(dropdown.props('checkbox')).toBe(false)
    expect(dropdown.props('icon')).toBe('action:add')
  })

  it('does not offer to create a tag that already exists', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'db')

    expect(findOptionTags(wrapper)).toEqual(['db'])
    expect(findOptions(wrapper)[0].dropdown.props('checkbox')).toBe(true)
  })

  it('adds the created tag on save', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'brand-new')
    await clickTagOption(wrapper, 'brand-new')
    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: ['brand-new'], removed: [] }])
  })
})

describe('saving', () => {
  it('emits nothing until the changes are saved', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')

    expect(findSavedChanges(wrapper)).toBeUndefined()
  })

  it('keeps the save button enabled when nothing has changed', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)

    expect(getUiButton(wrapper, t('action:save')).props('disabled')).toBeFalsy()

    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'db')

    expect(getUiButton(wrapper, t('action:save')).props('disabled')).toBeFalsy()
  })

  it('only closes the dropdown when saving without changes', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'db')
    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toBeUndefined()
    expect(isDropdownOpen(wrapper)).toBe(false)
  })

  it('emits the additions and removals and closes the dropdown on save', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')
    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: ['db'], removed: ['web'] }])
    expect(isDropdownOpen(wrapper)).toBe(false)
  })

  it('keeps the changes in progress when the tags are updated meanwhile', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickTagOption(wrapper, 'web')

    await wrapper.setProps({ tags: ['production', 'web'] })
    await flushPromises()

    expect(findCheckedOptionTags(wrapper)).toEqual(['db', 'production'])
  })

  it('only emits its own changes when the tags are changed meanwhile', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')

    await wrapper.setProps({ tags: ['production', 'backup'] })
    await flushPromises()

    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: ['db'], removed: [] }])
  })

  it('discards the changes on cancel', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await clickButton(wrapper, t('cancel'))

    expect(isDropdownOpen(wrapper)).toBe(false)

    await openTagSelect(wrapper)

    expect(findCheckedOptionTags(wrapper)).toEqual(['production', 'web'])
    expect(findSavedChanges(wrapper)).toBeUndefined()
  })

  it('discards the changes when the dropdown is closed without saving', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')
    await wrapper.trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(isDropdownOpen(wrapper)).toBe(false)

    await openTagSelect(wrapper)

    expect(findCheckedOptionTags(wrapper)).toEqual(['production', 'web'])
    expect(findSavedChanges(wrapper)).toBeUndefined()
  })
})

describe('selecting all the tags', () => {
  it('adds all the listed tags missing from the current tags', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickButton(wrapper, t('action:select-all'))
    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: ['analytics', 'db'], removed: [] }])
  })

  it('only adds the tags matching the search', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'db')
    await clickButton(wrapper, t('action:select-all'))
    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: ['db'], removed: [] }])
  })

  it('removes all the current tags', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickButton(wrapper, t('action:deselect-all'))
    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: [], removed: ['production', 'web'] }])
  })

  it('cannot select all the tags when they are all already selected', async () => {
    const wrapper = mountTagSelect({ suggestions: [] })

    await openTagSelect(wrapper)

    expect(getUiButton(wrapper, t('action:select-all')).props('disabled')).toBe(true)
    expect(getUiButton(wrapper, t('action:deselect-all')).props('disabled')).toBe(false)
  })

  it('cannot deselect all the tags when none of the listed tags is selected', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await searchTag(wrapper, 'db')

    expect(getUiButton(wrapper, t('action:select-all')).props('disabled')).toBe(false)
    expect(getUiButton(wrapper, t('action:deselect-all')).props('disabled')).toBe(true)
  })
})

describe('current tags', () => {
  it('lists the selected tags above the search, in alphabetical order', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, 'db')

    expect(findCurrentTags(wrapper)).toEqual(['db', 'production', 'web'])
  })

  it('deselects a tag removed from the current tags', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)
    await removeCurrentTag(wrapper, 'web')

    expect(findCurrentTags(wrapper)).toEqual(['production'])
    expect(findCheckedOptionTags(wrapper)).toEqual(['production'])

    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: [], removed: ['web'] }])
  })

  it('hides the current tags when no tag is selected', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)

    expect(wrapper.find('.current-tags').exists()).toBe(true)

    await clickButton(wrapper, t('action:deselect-all'))

    expect(wrapper.find('.current-tags').exists()).toBe(false)
  })
})

describe('empty tag', () => {
  it('lists the empty tag in the current tags, without offering to remove it', async () => {
    const wrapper = mountTagSelect({ tags: ['', 'production'] })

    await openTagSelect(wrapper)

    const emptyTag = wrapper.get('.current-tags').getComponent(VtsTag)

    expect(emptyTag.props('value')).toBe('')
    expect(emptyTag.props('removable')).toBe(false)
  })

  it('keeps the empty tag when deselecting all the tags', async () => {
    const wrapper = mountTagSelect({ tags: ['', 'production'] })

    await openTagSelect(wrapper)
    await clickButton(wrapper, t('action:deselect-all'))

    expect(findCurrentTags(wrapper)).toEqual([''])

    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: [], removed: ['production'] }])
  })

  it('removes a whitespace-only tag unchecked in the options', async () => {
    const wrapper = mountTagSelect({ tags: ['   ', 'production'], suggestions: [] })

    await openTagSelect(wrapper)
    await clickTagOption(wrapper, '   ')
    await clickButton(wrapper, t('action:save'))

    expect(findSavedChanges(wrapper)).toEqual([{ added: [], removed: ['   '] }])
  })
})

describe('dropdown layout', () => {
  afterEach(() => setViewportWidth(DEFAULT_VIEWPORT_WIDTH))

  it('floats the dropdown next to its trigger on a large screen', async () => {
    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)

    const dropdown = wrapper.get<HTMLElement>('.dropdown-list')

    expect(dropdown.classes('fullscreen')).toBe(false)
    expect(dropdown.element.style.position).toBe('fixed')
  })

  it('opens the dropdown fullscreen on a small screen', async () => {
    setViewportWidth(800)

    const wrapper = mountTagSelect()

    await openTagSelect(wrapper)

    const dropdown = wrapper.get<HTMLElement>('.dropdown-list')

    expect(dropdown.classes('fullscreen')).toBe(true)
    expect(dropdown.element.style.position).toBe('')
  })
})
