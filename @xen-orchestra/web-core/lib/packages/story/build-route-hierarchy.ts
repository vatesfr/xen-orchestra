import type { StoryMeta } from '@core/packages/story/types.ts'
import { upperFirst } from 'lodash-es'
import { type RouteRecordNormalized, useRouter } from 'vue-router'

export type StoryRouteTreeNode = {
  label: string
  path: string
  children: StoryRouteTreeNode[]
}

type StoryRoute = RouteRecordNormalized & { meta: { story: StoryMeta } }

export function toStoryTitle(path: string) {
  return path
    .split('-')
    .map(part => upperFirst(part))
    .join(' ')
}

export function buildRouteHierarchy(): StoryRouteTreeNode[] {
  const { getRoutes } = useRouter()

  const routes = getRoutes().filter(route => (route as StoryRoute).meta.story?.isStory) as StoryRoute[]

  const root: StoryRouteTreeNode = {
    label: '',
    path: '',
    children: [],
  }

  const pathMap = new Map<string, StoryRouteTreeNode>()

  // Initialize the root node
  pathMap.set('', root)

  routes.forEach(route => {
    let currentPath = route.meta.story.rootPath
    let parentNode = root

    route.meta.story.pathParts.forEach(part => {
      currentPath += `/${part}`
      let childNode = pathMap.get(currentPath)

      if (!childNode) {
        childNode = {
          label: toStoryTitle(part),
          path: currentPath,
          children: [],
        }
        parentNode.children.push(childNode)
        pathMap.set(currentPath, childNode)
      }

      parentNode = childNode
    })
  })

  return root.children
}
