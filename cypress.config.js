import { defineConfig } from 'cypress'
import { downloadFile } from 'cypress-downloadfile/lib/addPlugin.js'
import path from 'path'
import chalk from 'chalk'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        downloadFile,

        parsePath(output) {
          return path.parse(output)
        },

        status() {
          console.log(chalk.green(...arguments))
          return null
        },
      })
    },
    viewportWidth: 2048,
  },
  experimentalStudio: true,
  video: false,
})
