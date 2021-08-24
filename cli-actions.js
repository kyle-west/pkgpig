const chalk = require('chalk');
const { buildGraph, identifyOutOfSync } = require('./index');
const { confirm, checkbox, text, select, number, password } = require('./lib/inputs')

function printDeps(deps = [], color = chalk.blue) {
  return deps.map(({ name }) => color(name)).join('  ')
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
      debugger
    } else if (action === 'Prepare new release') {
      let targetPkg
      while (!targetPkg) {
        const targetName = await text('Which package are you wanting to release?')
        targetPkg = connections[targetName]
        if (!targetPkg) {
          console.log(chalk.red('Package not found, please enter again'))
        }
      }
      const targetVersion = await text(`What is the new version (current is ${targetPkg.version.original})?`)
      console.log(chalk.green(`Preparing update for ${targetPkg.name} to move to version ${targetVersion}`))
      console.log('Not implemented yet, sorry')
    } else {
      console.log('Not implemented yet, sorry')
    }
  }

  return { test, graph, sync }
}