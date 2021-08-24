const chalk = require('chalk');
const { confirm, checkbox, text, select, number, password } = require('./lib/inputs')

module.exports = function getHandlers ({ appData }) {
  
  async function test (action, type, rest) {
    appData.test = appData.test || { timesCalled: 0, lastCalledArgs: {} }
    const lastCalledArgs = appData.test.lastCalledArgs

    if (action === 'input') {
      console.log(await confirm('This is a confirm prompt.', true))      
      console.log(await text('This is a question, answer it!'))
      console.log(await select('Select a food', ['Taco', 'Burrito', 'Salad']))
      console.log(await checkbox('Select any foods',['Taco', 'Burrito', 'Salad']))
      console.log(await number('type a number'))
      console.log(await password('type a password'))

    } else {
      console.log('`test` called for the', ++appData.test.timesCalled, 'time')
      console.log('Current Args: ', chalk.blue(action), chalk.green(type), { rest })
      console.log('Previous Args:', chalk.blue(lastCalledArgs.action), chalk.green(lastCalledArgs.type), { rest: lastCalledArgs.rest })
    }

    appData.test.lastCalledArgs = { action, type, rest }
  }

  return { test }
}