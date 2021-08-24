#!/usr/bin/env node
const { resolve } = require('path')
const { Command } = require('commander');
const getHandlers = require('./index')
const pojoStick = require('pojo-stick')
const pkg = require('./package.json')

;(async () => {
  // persistent appData
  const appData = await pojoStick(resolve('.', '.data-store.json'))

  const { test } = getHandlers({ appData })

  const program = new Command();

  program
    .version(pkg.version)
    .description('__REPLACE_DESCRIPTION_WITH_MAKE_CMD__')
    .option('-d, --debug', 'enable debug mode')
  ;
  
  program
    .command('test <action> [type] [rest...]')
    .description('Test out the CLI API')
    .action(test)
  ;
  
  program.parse(process.argv);
})()
