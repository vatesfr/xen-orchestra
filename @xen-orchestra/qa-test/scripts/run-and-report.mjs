#!/usr/bin/env node
/**
 * Runs the full QA test suite and emails a report via Gmail (or any SMTP).
 *
 * Required .env variables:
 *   SMTP_USER     Gmail address (or SMTP username)
 *   SMTP_PASS     App Password (16-char Gmail app password)
 *   SMTP_TO       Recipient address(es), comma-separated
 *
 * Optional .env variables:
 *   SMTP_HOST     SMTP host (default: smtp.gmail.com)
 *   SMTP_PORT     SMTP port (default: 587)
 *   SMTP_FROM     Sender address (defaults to SMTP_USER)
 *
 * Usage:
 *   yarn report               run the full test suite and send results
 *   yarn report:smtp-test     verify SMTP config by sending an empty test mail
 */

import { spawn, execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { createTransport } from 'nodemailer'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBranchName() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', cwd: ROOT }).trim()
  } catch {
    return 'unknown'
  }
}

function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8', cwd: ROOT }).trim()
  } catch {
    return 'unknown'
  }
}

function formatDatetime(date) {
  // "19/11/2026 13:43 (Paris)"
  return `${date.toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    dateStyle: 'short',
    timeStyle: 'short',
  })} (Paris)`
}

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms / 60000) % 60)
    .toString()
    .padStart(2, '0')
  return `${hours}h${minutes}`
}

function getCount(output, label) {
  const match = output.match(new RegExp(`ℹ ${label} (\\d+)`))
  if (match === null) {
    return '?'
  } else {
    return match[1]
  }
}

// ---------------------------------------------------------------------------
// Test runner — streams output to the terminal AND buffers it for the mail body
// ---------------------------------------------------------------------------

async function runTests() {
  return new Promise(resolve => {
    const chunks = []
    let logFilePath = null

    const child = spawn('node', ['--test', '--test-concurrency=1', 'tests/*.test.js'], {
      shell: true,
      cwd: ROOT,
      env: process.env,
    })

    const collect = (stream, dest) => {
      stream.on('data', chunk => {
        dest.write(chunk)
        const text = chunk.toString()
        chunks.push(text)
        // logSetup.js writes the debug log path to stderr on startup
        const match = text.match(/\[qa-test\] debug log: (.+\.log)/)
        if (match !== null) {
          logFilePath = match[1].trim()
        }
      })
    }

    collect(child.stdout, process.stdout)
    collect(child.stderr, process.stderr)

    child.on('close', code => {
      resolve({ success: code === 0, output: chunks.join(''), logFilePath })
    })
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const requiredVars = ['SMTP_USER', 'SMTP_PASS', 'SMTP_TO']
const missing = requiredVars.filter(k => !process.env[k])
if (missing.length > 0) {
  process.stderr.write(`[run-and-report] Missing required env vars: ${missing.join(', ')}\n`)
  process.exit(2)
}

const transport = createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ---------------------------------------------------------------------------
// SMTP connectivity test — yarn report:smtp-test
// ---------------------------------------------------------------------------

if (process.argv.includes('--smtp-test')) {
  process.stderr.write(`[run-and-report] Sending SMTP test mail to ${process.env.SMTP_TO}...\n`)
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: process.env.SMTP_TO,
    subject: `[qa-test] SMTP connectivity test ${formatDatetime(new Date())}`,
    text: 'SMTP configuration is working correctly.',
  })
  process.stderr.write(`[run-and-report] Test mail sent → ${process.env.SMTP_TO}\n`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Full run
// ---------------------------------------------------------------------------

const branch = getBranchName()
const commitHash = getCommitHash()
const startedAt = new Date()

process.stderr.write(`[run-and-report] branch=${branch}\n`)

const { success, output, logFilePath } = await runTests()
const runtimeInMs = Date.now() - startedAt.getTime()

const emoji = success ? '✅' : '❌'
const status = success ? 'success' : 'failure'
const successTests = getCount(output, 'pass')
const totalTests = getCount(output, 'tests')
const failedTests = getCount(output, 'fail')
const cancelledTests = getCount(output, 'cancelled')
const skippedTests = getCount(output, 'skipped')

const subject = `${emoji} ${status} ${successTests}/${totalTests} passed ${formatDatetime(startedAt)} on ${branch}@${commitHash}`
const summary = `Result: ${emoji} ${status}
Commit: ${branch}@${commitHash}
Tests: ${successTests}/${totalTests} passed, ${failedTests} failed, ${cancelledTests} cancelled, ${skippedTests} skipped
Duration: ${formatDuration(runtimeInMs)}`

// Attach the full structured debug log if we found its path
const attachments = []
if (logFilePath !== null) {
  try {
    attachments.push({
      filename: `qa-debug-${startedAt.toISOString().slice(0, 10)}.log`,
      content: await readFile(logFilePath),
    })
  } catch (err) {
    process.stderr.write(`[run-and-report] Could not read log file: ${err.message}\n`)
  }
}

await transport.sendMail({
  from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
  to: process.env.SMTP_TO,
  subject,
  text: `${summary}
----------------------------------------
${output}`,
  attachments,
})

process.stderr.write(`[run-and-report] Report sent → ${process.env.SMTP_TO}\n`)
process.exit(success ? 0 : 1)
