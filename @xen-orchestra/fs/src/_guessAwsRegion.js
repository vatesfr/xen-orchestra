export default function guessAwsRegion(host) {
  const matches = /^s3\.([^.]+)\.amazonaws.com$/.exec(host)
  return matches !== null ? matches[1] : 'us-east-1'
}
