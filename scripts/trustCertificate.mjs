#!/usr/bin/env node

import https from 'node:https'
import tls from 'node:tls'

const [, , host, port = 443] = process.argv

async function tryRequest(options) {
  https
    .request(options, res => {
      console.log('statusCode:', res.statusCode)
    })
    .on('error', function (error) {
      console.error('error:', error)
    })
    .end()
}

function getCertificate(options) {
  return new Promise((resolve, reject) => {
    tls
      .connect(options, function () {
        resolve(this.getPeerX509Certificate())
        this.end()
      })
      .on('error', function (error) {
        this.destroy()
        reject(error)
      })
  })
}

// Trying request : it fails if self-signed certificate
const options = { host, port, rejectUnauthorized: true, servername: host }
console.log('\n-> Request with no certificate')
tryRequest(options)

// Asking for certificate
const certificate = await getCertificate({ ...options, rejectUnauthorized: false })

console.log('=> Certificate acquired')
// console.log(certificate.subject, certificate.issuer, certificate.validFrom, certificate.validTo)
// console.log(certificate.verify(certificate.publicKey))

// Trying again with certificate
console.log('\n-> Request using acquired certificate')
tryRequest({
  ...options,
  ca: [...tls.rootCertificates, certificate.toString()],
  // adding default ca with ...tls.rootCertificates avoids failing requests with other valid certificates, but it looks likes it also makes succeeding requests we want to fail (like https://pinning-test.badssl.com/)
  // checkServerIdentity: () => {return undefined}, // for localhost
})
