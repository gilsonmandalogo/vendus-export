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
  fs.mkdirSync(appPath, { recursive: true })

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, '{}', 'utf-8')
  }

  program
    .name(app.name)
    .version(app.version)

  const exportCommand = program.command('export')
  exportCommand
    .description('Exports to pdf files a complete month of documents')
    .requiredOption('-m, --month <number>', 'Month to be exported')
    .requiredOption('-o, --output <path>', 'Path to save exported zip file')
    .action(exportFile)

  const configCommand = program.command('config <name> [value]')
  configCommand
    .description('Read or set a configuration')
    .action(configAction)

  program.parse()
}

const exportFile = async (options) => {
  try {
    log(chalk.underline(`${app.name} v${app.version}`))
    log('')

    validateConfig()

    const { month, output } = options
    const selectedMonth = parseInt(month)

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
        output: path.resolve(output),
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

const configAction = (name, value) => {
  const file = fs.readFileSync(configPath, 'utf-8')
  const parsed = JSON.parse(file)

  if (value) {
    parsed[name] = value
    fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf-8')
  } else {
    log(parsed[name])
  }
}

function validateConfig() {
  const file = fs.readFileSync(configPath, 'utf-8')
  const parsed = JSON.parse(file)
  const keys = ['base-url', 'user', 'password']

  for (const key of keys) {
    if (!parsed[key]) {
      throw new Error(`${key} is missing on configuration`)
    }
  }

  Object.assign(config, parsed)
}

function formatDate(date) {
  return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`
}

main()
