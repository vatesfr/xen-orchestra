import type { RouteRecordRaw } from 'vue-router'

const componentLoaders = import.meta.glob(['@/stories/**/*.story.vue', '@core/stories/**/*.story.vue'])
const docLoaders = import.meta.glob<string>(['@/stories/**/*.story.md', '@core/stories/**/*.story.md'], {
  query: '?raw',
  import: 'default',
})

const children: RouteRecordRaw[] = Object.entries(componentLoaders).map(([path, componentLoader]) => {
  const basePath = path
    .replace(/^\/src\/stories\/(.*)\.story.vue$/, '$1')
    .replace(/^\.\.\/web-core\/lib\/stories\/(.*)\.story.vue$/, 'web-core/$1')

  const docPath = path.replace(/\.vue$/, '.md')
  const routeName = `story-${basePath}`

  return {
    name: routeName,
    path: basePath,
    component: componentLoader,
    meta: {
      isStory: true,
      storyTitle: basePathToStoryTitle(basePath),
      storyMdLoader: docLoaders[docPath],
    },
  } satisfies RouteRecordRaw
})

if (import.meta.env.DEV) {
  children.push({
    path: '',
    name: 'story-home',
    component: () => import('@/views/story/HomeView.vue'),
  })
}

export default {
  path: '/story',
  name: 'story',
  component: () => import('@/views/StoryView.vue'),
  children,
  meta: { hasStoryNav: true },
}

/**
 * Transform the route basename to a page title.
 *
 * Example:
 *  Filename: `my-component.story.vue`
 *  Basename: `my-component`
 *  Page title: `My Component`
 */
function basePathToStoryTitle(basePath: string) {
  return basePath
    .split('/')
    .pop()!
    .split('-')
    .map(s => `${s.charAt(0).toUpperCase()}${s.substring(1)}`)
    .join(' ')
}
