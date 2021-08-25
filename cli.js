#!/usr/bin/env node
const { Command } = require('commander');
const getHandlers = require('./cli-actions')
const pkg = require('./package.json')

;(async () => {
  const { graph, sync } = getHandlers()

  const program = new Command();

  program
    .command('sync')
    .description('Manage package versions in coordination')
    .action(sync)
  ;
  
  program
    .command('graph')
    .description('View the dependency graph')
    .action(graph)
  ;
  
  program
    .version(pkg.version)
    .description('Manage semantic versioning in a monorepo context.')
  ;

  program.parse(process.argv);
})()
