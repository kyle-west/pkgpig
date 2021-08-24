const { resolve } = require('path')
const { makeDependencyGraph } = require('./lib/pkg');
const { getAllPackages } = require('./lib/util');

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

module.exports = {
  getPackages,
  buildGraph,
}
