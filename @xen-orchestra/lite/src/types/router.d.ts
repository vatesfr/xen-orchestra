declare module 'vue-router' {
  interface RouteMeta {
    hasStoryNav?: boolean
    isStory?: boolean
    storyTitle?: string
    storyMdLoader?: () => Promise<string>
  }
}
export {}
