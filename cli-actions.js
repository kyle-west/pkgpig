const chalk = require('chalk');
const { buildGraph } = require('./index');
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

  return { test, graph }
}