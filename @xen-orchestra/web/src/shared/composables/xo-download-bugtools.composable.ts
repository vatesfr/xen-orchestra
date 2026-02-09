export function useDownloadBugtools() {
  const downloadArchive = async (url: string, foldername: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = foldername
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    downloadArchive,
  }
}
