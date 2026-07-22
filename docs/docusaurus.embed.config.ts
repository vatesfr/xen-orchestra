// Build variant for serving the docs *inside* xo-server under the `/docs` route.
//
// It only overrides baseUrl so every asset/link is resolved under `/docs/`
// (the public site keeps baseUrl `/`). trailingSlash stays false to match how
// the docs' relative links are authored.
//
// Rebuild with:
//   yarn build:xo-server
//
// Then it is mounted in packages/xo-server/config.toml under [http.mounts].
import base from './docusaurus.config'

export default {
  ...base,
  baseUrl: '/docs/',
}
