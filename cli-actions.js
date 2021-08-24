const chalk = require('chalk');
const { inc } = require('./lib/util');
const semver = require('semver');
const { buildGraph, targetUpdate, identifyOutOfSync, commit } = require('./index');
const { confirm, checkbox, text, select, number, password } = require('./lib/inputs')

function printDeps(deps = [], color = chalk.blue) {
  return deps.map(({ name }) => color(name)).join('  ')
}

function byKey([a], [b]) {
  return a.localeCompare(b)
}

function printChangedVersions (graph) {
  Object.entries(graph).sort(byKey).forEach(([name, { version: { original, pending } }]) => {
    if (original !== pending) {
      console.log(`  ${name} ${original} --> ${pending}`)
    }
  })
}

function printUpdatedVersions (targetPkg, updated) {
  console.log(`Moving ${targetPkg.name} from ${targetPkg.version.original} to ${targetPkg.version.pending} implies:`)
  printChangedVersions(updated)
}

module.exports = function getHandlers () {
  
  async function test (action, type, rest) {
    if (action === 'input') {
      console.log(await confirm('This is a confirm prompt.', true))      
      console.log(await text('This is a question, answer it!'))
      console.log(await select('Select a food', ['Taco', 'Burrito', 'Salad']))
      console.log(await checkbox('Select any foods',['Taco', 'Burrito', 'Salad']))
      console.log(await number('type a number'))
      console.log(await password('type a password'))
    } else {
      console.log('Current Args: ', chalk.blue(action), chalk.green(type), { rest })
    }
  }

  async function graph () {
    const connections = buildGraph()
    Object.entries(connections).forEach(([name, { dependencies, peerDependencies, devDependencies }]) => {
      console.log(
        chalk.green(name), 
        '\n   DEPS', printDeps(dependencies, chalk.cyan),
        '\n   PEER', printDeps(peerDependencies, chalk.blue),
        '\n   DEVS', printDeps(devDependencies, chalk.grey),
        '\n'
      )
    })
  }

  async function sync () {
    const connections = buildGraph()
    const action = await select('What would you like to do?', [
      'View out of sync packages',
      'Update out of sync packages',
      'Prepare new release',
    ])

    if (action === 'View out of sync packages') {
      const outOfSync = identifyOutOfSync(connections)
      if (outOfSync.dependencies.length) {
        console.log(chalk.bgBlue('dependencies'))
        console.table(outOfSync.dependencies)
      }
      if (outOfSync.peerDependencies.length) {
        console.log(chalk.bgCyan('peerDependencies'))
        console.table(outOfSync.peerDependencies)
      }
      if (outOfSync.devDependencies.length) {
        console.log(chalk.bgGray('devDependencies'))
        console.table(outOfSync.devDependencies)
      }

      if (outOfSync.dependencies.length + outOfSync.peerDependencies.length + outOfSync.devDependencies.length === 0) {
        console.log('Everything up to date.')
      }
    } else if (action === 'Prepare new release') {
      let nextAction
      let userLoop = 'continue'
      
      while (userLoop !== 'done') {
        const targetName = await select('Which package are you wanting to release?', Object.keys(connections).sort())
        const targetPkg = connections[targetName]
        const promptDetail = targetPkg.version.pending === targetPkg.version.original
          ? `current is ${targetPkg.version.pending}`
          : `pending is ${targetPkg.version.pending}`;
        const targetVersion = await text(`What is the new version (${promptDetail})?`)
        
        console.log(chalk.green(`Preparing update for ${targetPkg.name} to move to version ${targetVersion}`))
        const updated = targetUpdate(targetPkg, targetVersion, connections)
        printUpdatedVersions(targetPkg, updated)
        
        nextAction = await select('What would you like to do next?', [
          'Accept all changes',
          'Reject all changes',
          'Prepare another update alongside the current pending state'
        ])

        if (nextAction === 'Accept all changes') {
          commit(connections)
          userLoop = 'done'
        }
        if (nextAction === 'Reject all changes') {
          console.log('Aborting...')
          userLoop = 'done'
        }
      }
    } else if ('Update out of sync packages') {
      const fixOutOfSync = (pkg) => {
        const needsMajor = pkg.needsMajorUpdateIfConsumedFlat()
        if (needsMajor) {
          const { prerelease } = semver.parse(pkg.version.original)
          
          let targetVersion = inc(pkg.version.original, 'major')
          const pr = prerelease && prerelease.length ? prerelease[0] : null
          if (pkg.version.original.startsWith('0')) {
            targetVersion = inc(pkg.version.original, `major-pre`)
            if (pr) {
              targetVersion = inc(pkg.version.original, `major-pre${pr}`)
            }
          } else if (pr) {
            targetVersion = inc(pkg.version.original, `major-${pr}`)
          }
          targetUpdate(pkg, targetVersion, connections)
        }
      }
      Object.values(connections).forEach(fixOutOfSync)
      Object.values(connections).forEach(fixOutOfSync)
      Object.values(connections).forEach(fixOutOfSync)

      console.log('The following packages will update:')
      printChangedVersions(connections)

      let nextAction = await select('What would you like to do next?', [
        'Accept all changes',
        'Reject all changes',
      ])
      
      if (nextAction === 'Accept all changes') {
        commit(connections)
      }
      if (nextAction === 'Reject all changes') {
        console.log('Aborting...')
      }
    } else {
      console.log('Not implemented yet, sorry.')
    }
  }

  return { test, graph, sync }
}