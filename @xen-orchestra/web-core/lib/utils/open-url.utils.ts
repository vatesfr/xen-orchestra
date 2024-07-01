export function openUrl(url: string, targetBlank?: boolean) {
  window.open(url, targetBlank ? '_blank' : '_self')
}
