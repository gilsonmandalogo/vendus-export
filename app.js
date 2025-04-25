#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import os from 'os'
import url from 'url'
import chalk from 'chalk'
import { program } from 'commander'
import cypress from 'cypress'

const log = console.log
const config = {}
const dirname = path.dirname(url.fileURLToPath(import.meta.url))
const app = JSON.parse(fs.readFileSync(path.resolve(dirname, 'package.json'), 'utf-8'))
const appPath = path.resolve(os.homedir(), '.config', app.name)
const configPath = path.resolve(appPath, '.config.json')

function main() {
  program
    .name(app.name)
    .version(app.version)

  const exportCommand = program.command('export')
  exportCommand
    .description('Exports to pdf files a complete month of documents')
    .option('-m, --month <number>', 'Month to be exported', String(new Date().getMonth()))
    .requiredOption('-o, --output <path>', 'Path to save exported zip file')
    .option('-c, --config <path>', 'Custom path for configuration file', configPath)
    .action(exportFileAction)

  const configCommand = program.command('config <name> [value]')
  configCommand
    .description('Read or set a configuration')
    .action(configAction)

  program.parse()
}

async function exportFileAction(options) {
  log(chalk.underline(`${app.name} v${app.version}`))
  log('')

  validateConfig(options)
  await doExportFileAction()
}

async function doExportFileAction() {
  try {
    const selectedMonth = parseInt(config.month)

    if (selectedMonth === NaN) {
      throw new Error('Invalid month')
    }

    const start = new Date()
    start.setMonth(selectedMonth - 1)
    start.setUTCDate(1)

    const end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + 1)
    end.setUTCDate(0)

    log(chalk.gray(`From ${start.toUTCString()} to ${end.toUTCString()}`))
    log('')

    log(chalk.green('Loading Vendus page...'))
    await cypress.run({
      config: {
        e2e: {
          baseUrl: config['base-url'],
          supportFile: path.resolve(dirname, 'cypress/support/e2e.js'),
          specPattern: path.resolve(dirname, 'cypress/e2e/*.cy.js'),
        },
      },
      env: {
        user: config.user,
        password: config.password,
        output: path.resolve(config.output),
        start: formatDate(start),
        end: formatDate(end),
      },
      spec: path.resolve(dirname, 'cypress/e2e/exportPdf.cy.js'),
      quiet: true,
      configFile: path.resolve(dirname, 'cypress.config.js'),
    })

    log(chalk.bold.green('Done, enjoy your saved time!'))
  } catch (error) {
    log('')

    if (error instanceof Error) {
      log(`${error.name}: ${error.message}`)
      log(error.stack)
    } else {
      log(error)
    }

    log(chalk.red('Program exited due to error. 😢'))
    process.exitCode = 1
  }
}

function configAction(name, value) {
  fs.mkdirSync(appPath, { recursive: true })

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, '{}', 'utf-8')
  }

  const file = fs.readFileSync(configPath, 'utf-8')
  const parsed = JSON.parse(file)

  if (value) {
    parsed[name] = value
    fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf-8')
  } else {
    log(parsed[name])
  }
}

function validateOptions(options) {
  const keys = ['base-url', 'user', 'password', 'output']

  for (const key of keys) {
    if (!options[key]) {
      throw new Error(`${key} is missing on configuration`)
    }
  }

  Object.assign(config, parsed)
}

function validateConfig(options) {
  const file = fs.readFileSync(path.resolve(options.config), 'utf-8')
  const parsed = JSON.parse(file)
  validateOptions({ ...parsed, ...options })
}

function formatDate(date) {
  return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`
}

export async function exportFile(options) {
  validateOptions(options)
  await doExportFileAction()
}

main()
