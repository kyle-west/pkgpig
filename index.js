const { resolve } = require('path')
const { makeDependencyGraph, inverseDependencyGraph } = require('./lib/pkg');
const { getAllPackages } = require('./lib/util');
const semver = require('semver');

function getPackages() {
  const packageFilenames = getAllPackages()
  const packageFiles = packageFilenames
    .map((file) => ({ file, contents: require(resolve(file)) }))
  return packageFiles;
}

function buildGraph (packages) {
  const graph = makeDependencyGraph(getPackages(packages))
  return graph;
}

function identifyOutOfSync (graph) {
  const inverseGraph = inverseDependencyGraph(graph)
  const outOfSync = { dependencies: [] , peerDependencies: [], devDependencies: [] }
  
  function check(type) {
    Object.entries(inverseGraph[type]).forEach(([name, dependents]) => {
      const pkg = graph[name]
      dependents.forEach((dependent) => {
        const range = dependent._contents[type][name]
        const inSync = semver.satisfies(pkg.version.original, range)
        if (!inSync) {
          outOfSync[type].push({ name: dependent.name, requires: `${name}@${range}`, current: pkg.version.original })
        }
      })
    })
  }

  check('dependencies')
  check('peerDependencies')
  check('devDependencies')
  
  return outOfSync
}

module.exports = {
  getPackages,
  buildGraph,
  identifyOutOfSync,
}
