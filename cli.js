#!/usr/bin/env node
const { Command } = require('commander');
const getHandlers = require('./cli-actions')
const pkg = require('./package.json')

;(async () => {
  const { graph, sync } = getHandlers()

  const program = new Command();

  program
    .version(pkg.version)
    .description('Manage semantic versioning in a monorepo context.')
    .option('-d, --debug', 'enable debug mode')
  ;
  
  program
    .command('graph')
    .description('View the dependency graph')
    .action(graph)
  ;
  
  program
    .command('sync')
    .description('Manage package versions in coordination')
    .action(sync)
  ;
  
  program.parse(process.argv);
})()
