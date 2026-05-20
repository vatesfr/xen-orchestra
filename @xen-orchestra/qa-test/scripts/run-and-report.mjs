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
 *   node --env-file-if-exists=.env scripts/run-and-report.mjs
 *   yarn report
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

function formatDatetime(date) {
  // "2026-05-20 08:42 UTC"
  return date
    .toISOString()
    .replace('T', ' ')
    .replace(/:\d{2}\.\d+Z$/, ' UTC')
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

const branch = getBranchName()
const startedAt = new Date()

process.stderr.write(`[run-and-report] branch=${branch}\n`)

const { success, output, logFilePath } = await runTests()

const status = success ? 'success' : 'failure'
const subject = `test run ${formatDatetime(startedAt)} ${branch} ${status}`

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

const transport = createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

await transport.sendMail({
  from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
  to: process.env.SMTP_TO,
  subject,
  text: output,
  attachments,
})

process.stderr.write(`[run-and-report] Report sent → ${process.env.SMTP_TO}\n`)
process.exit(success ? 0 : 1)
