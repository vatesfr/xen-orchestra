import { watchEffect } from "vue";
import { type RouteLocationNormalizedLoaded, useRouter } from "vue-router";

export const useRedirectIfNotFound = (
  isReady: () => boolean,
  isFound: (route: RouteLocationNormalizedLoaded) => boolean,
  routeName = "notFound"
) => {
  const { currentRoute, push } = useRouter();

  watchEffect(() => {
    if (isReady() && !isFound(currentRoute.value)) {
      push({ name: routeName });
    }
  });
};
