import { fileURLToPath } from 'url'
import path from 'path'
import proc from 'child_process'
import fs from 'fs'

function resolvePath (...pathChunk) {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), ...pathChunk)
}

function runCommand (command, cwd = undefined) {
  const commandParts = command.split(' ')
  const commandArgs = commandParts.length <= 1 ? [] : commandParts.slice(1)

  proc.spawnSync(commandParts[0], commandArgs, {
    stdio: 'inherit',
    windowsHide: false,
    cwd: resolvePath(cwd || process.cwd())
  })
}

function createPackageJson () {
  const filterKeys = ['scripts', 'devDependencies', 'packageManager']

  // read package.json file
  const packageJson = JSON.parse(fs.readFileSync(resolvePath('package.json'), 'utf-8'))

  // filter keys
  const distPackageJson = {}
  for (const key in packageJson) {
    if (!filterKeys.includes(key)) {
      distPackageJson[key] = packageJson[key]
    }
  }

  // write package.json file to dist directory
  fs.writeFileSync(
    resolvePath('dist/package.json'),
    JSON.stringify(distPackageJson, null, 2),
    'utf-8'
  )
}

// create distribution package.json
createPackageJson()

// run pnpm publish
runCommand('pnpm publish --no-git-checks', resolvePath('dist'))

// remove distribution package.json
runCommand('rm package.json', resolvePath('dist'))
