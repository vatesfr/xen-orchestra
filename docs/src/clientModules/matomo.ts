import type {ClientModule} from '@docusaurus/types';
import siteConfig from '@generated/docusaurus.config';

type MatomoConfig = {
  url: string;
  siteId: string;
};

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

const matomo = siteConfig.customFields?.matomo as MatomoConfig | undefined;
const enabled =
  typeof window !== 'undefined' && Boolean(matomo?.url && matomo?.siteId);

if (enabled && matomo) {
  const _paq = (window._paq = window._paq || []);
  // Cookieless: no consent banner needed.
  _paq.push(['disableCookies']);
  _paq.push(['enableLinkTracking']);
  _paq.push(['setTrackerUrl', `${matomo.url}matomo.php`]);
  _paq.push(['setSiteId', matomo.siteId]);
  const script = document.createElement('script');
  script.async = true;
  script.src = `${matomo.url}matomo.js`;
  document.head.appendChild(script);
  setupSearchTracking();
}

// Fires on first render (previousLocation null) and on every SPA navigation,
// so page views are counted without a Matomo-specific router integration.
const clientModule: ClientModule = {
  onRouteDidUpdate({location, previousLocation}) {
    if (!enabled) {
      return;
    }
    if (
      previousLocation &&
      previousLocation.pathname === location.pathname &&
      previousLocation.search === location.search
    ) {
      // Hash-only change (e.g. heading anchor): not a new page view.
      return;
    }
    trackPageViewWhenTitleSettles();
  },
};

// The document title is rewritten by React around the route hook (after
// it on SPA navigations, during hydration on the initial load), so an
// immediate snapshot can record the view under the wrong page's title.
// Track once the title has stopped changing for a beat, with a hard cap
// so a view is never lost.
let cancelPendingPageView: (() => void) | undefined;
function trackPageViewWhenTitleSettles() {
  // A navigation arriving before the previous view settled supersedes it;
  // firing both would count the new URL twice.
  cancelPendingPageView?.();
  let fired = false;
  let debounce: number | undefined;
  let observer: MutationObserver | undefined;
  const fire = () => {
    if (fired) {
      return;
    }
    fired = true;
    observer?.disconnect();
    window.clearTimeout(debounce);
    window._paq?.push(['setCustomUrl', window.location.href]);
    window._paq?.push(['setDocumentTitle', document.title]);
    window._paq?.push(['trackPageView']);
  };
  cancelPendingPageView = () => {
    fired = true;
    observer?.disconnect();
    window.clearTimeout(debounce);
  };
  const titleElement = document.querySelector('title');
  if (!titleElement) {
    fire();
    return;
  }
  debounce = window.setTimeout(fire, 250);
  observer = new MutationObserver(() => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(fire, 100);
  });
  observer.observe(titleElement, {childList: true, characterData: true, subtree: true});
  setTimeout(fire, 1000);
}

// The lunr search box (docusaurus-lunr-search) is client-side only, so no
// query is ever logged server-side. Watch the input, and once the visitor
// stops typing, report the query and how many suggestions the dropdown
// shows. Zero-result queries are the list of articles we should write.
function setupSearchTracking() {
  let debounce: number | undefined;
  document.addEventListener(
    'input',
    (event) => {
      const target = event.target as HTMLInputElement;
      if (target?.id !== 'search_input_react') {
        return;
      }
      window.clearTimeout(debounce);
      const keyword = target.value.trim();
      if (keyword.length < 3) {
        return;
      }
      debounce = window.setTimeout(() => {
        // The visitor may have navigated away (e.g. clicked a suggestion)
        // in the meantime: only report if the query is still on screen,
        // and only report zero on the explicit no-results template, so
        // a dismissed dropdown never fakes a zero-result search.
        if (target.value.trim() !== keyword) {
          return;
        }
        const noResults = document.querySelector(
          '.ds-dropdown-menu [class*="--no-results"]',
        );
        const suggestions = document.querySelectorAll(
          '.ds-dropdown-menu .ds-suggestion',
        ).length;
        if (noResults) {
          window._paq?.push(['trackSiteSearch', keyword, false, 0]);
        } else if (suggestions > 0) {
          window._paq?.push(['trackSiteSearch', keyword, false, suggestions]);
        }
      }, 1500);
    },
    true,
  );
}

export default clientModule;
