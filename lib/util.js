const { execSync } = require('child_process')

function terminalIO(command, options) {
  const commandOutput = execSync(command, Object.assign({ encoding: 'utf8' }, options))
  options && options.logOutput && console.log(commandOutput)
  return typeof commandOutput === 'string' ? commandOutput.trim() : commandOutput
}

function getAllPackages() {
  let output = terminalIO('find packages -name package.json -type f -not -path "*/node_modules/*"') || ''
  output = output.split && output.split(/\s+/)
  return output
}

module.exports = {
  terminalIO,
  getAllPackages,
}