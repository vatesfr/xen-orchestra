#!/usr/bin/env node

import https from 'node:https'
import tls from 'node:tls'
import { X509Certificate } from 'node:crypto'

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
        resolve(this.getPeerCertificate())
        // we could also use directly this.getPeerX509Certificate() but then we can't show certificate informations
        // pubkey = this.getPeerCertificate().pubkey may be usefull too
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
const peerCertificate = await getCertificate({ ...options, rejectUnauthorized: false })
// console.log(peerCertificate)

const certificate = new X509Certificate(peerCertificate.raw)
// certificate.verify(publicKey: KeyObject) may be usefull too

// Trying again with certificate
console.log('\n-> Request using acquired certificate')
tryRequest({
  ...options,
  ca: certificate.toString(), // ca can be a certificate or a list of certificates
  checkServerIdentity: () => {
    return null
  }, // maybe usefull only for localhost
})
