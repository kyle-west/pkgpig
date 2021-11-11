const inquirer = require('inquirer')
const base = inquirer.createPromptModule()

const prompt = async ({ name = '__last_asked_question__', ...props } = {}) => {
  return (await base({ name, ...props }))[name]
}

const notEmpty = (input) => {
  if (!input) {
    return 'Please provide an answer'
  }

  return true
}

const isNumber = (input) => {
  const empty = notEmpty(input)
  if (empty !== true) return empty

  if (isNaN(Number(input))) {
    return `Please type a number, received "${input}"`
  }

  return true
}

module.exports = {
  text: (message = '', options = {}) =>
    prompt({ validate: notEmpty, ...options, type: 'input', message }),
  number: async (message = '', options = {}) => {
    const numText = await prompt({
      validate: isNumber,
      ...options,
      type: 'input',
      message,
    })
    return Number(numText)
  },
  password: (message = '', options = {}) =>
    prompt({ validate: notEmpty, ...options, type: 'password', message }),

  checkbox: (label, choices = [], options = {}) =>
    prompt({ validate: notEmpty, ...options, name: label, type: 'checkbox', choices }),
  select: (label, choices = [], options = {}) =>
    prompt({ validate: notEmpty, ...options, name: label, type: 'list', choices }),

  confirm: (message = '', defOption = false, options = {}) =>
    prompt({ validate: notEmpty, ...options, default: defOption, type: 'confirm', message }),

  validate: {
    isNumber,
    notEmpty,
  },
}
