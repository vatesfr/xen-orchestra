/**
 * Force the Typesense DocSearch bar (federated search across the three
 * doc sites), while docusaurus-lunr-search stays installed: that plugin
 * must keep generating search-doc.json at every build, because the
 * federation indexer consumes it. Both packages register a SearchBar;
 * themes resolve after plugins, so @theme-original picks the Typesense
 * one.
 */
export { default } from '@theme-original/SearchBar'
