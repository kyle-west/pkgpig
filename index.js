const { writeFile } = require('fs')
const { resolve } = require('path')
const { makeDependencyGraph, inverseDependencyGraph } = require('./lib/pkg');
const { getAllPackages } = require('./lib/util');
const semver = require('semver');
const { diff } = require('./lib/util');

function getPackages() {
  const packageFilenames = getAllPackages()
  const packageFiles = packageFilenames
    .map((file) => ({ file, contents: require(resolve(file)) }))
  return packageFiles;
}

function buildGraph () {
  const graph = makeDependencyGraph(getPackages())
  return graph;
}

function identifyOutOfSync (graph, versionType = 'original') {
  const inverseGraph = inverseDependencyGraph(graph)
  const outOfSync = { dependencies: [] , peerDependencies: [], devDependencies: [] }
  
  function check(type) {
    Object.entries(inverseGraph[type]).forEach(([name, dependents]) => {
      const pkg = graph[name]
      dependents.forEach((dependent) => {
        const range = dependent._contents[type][name]
        const inSync = semver.satisfies(pkg.version[versionType], range)
        if (!inSync) {
          outOfSync[type].push({ name: dependent.name, requires: `${name}@${range}`, current: pkg.version[versionType] })
        }
      })
    })
  }

  check('dependencies')
  check('peerDependencies')
  check('devDependencies')

  return outOfSync
}

function compareGT (target, current) {
  if (target.includes('major')) {
    return !current || current.includes('minor') || current.includes('patch') || current.includes('prerelease')
  }
  if (target.includes('minor')) {
    return !current || current.includes('patch') || current.includes('prerelease')
  }
  if (target.includes('patch')) {
    return !current || current.includes('prerelease')
  }
  if (target.includes('prerelease')) {
    return !current
  }
  return false
}

function cascade({ pkg, targetDiffType, dependents, graph }) {
  if (compareGT(targetDiffType, pkg.versionDiff)) {
    pkg.inc(targetDiffType)
    
    let [ baseType, prerelease = '' ] = targetDiffType.split('-');

    const bumpMajor = (dependent) => {
      if (baseType === 'major' && dependent.version.original.startsWith('0') && !prerelease.startsWith('pre')) {
        cascade({ pkg: dependent, targetDiffType: `major-pre${prerelease}`, dependents, graph })
      } else {
        cascade({ pkg: dependent, targetDiffType, dependents, graph })
      }
    }

    // all my dependents must be updated to the level I was updated
    dependents.dependencies[pkg.name]?.forEach(bumpMajor)
    dependents.peerDependencies[pkg.name]?.forEach(bumpMajor)

    // dev deps would be at most a patch, but we don't care since they don't release
    // but this would be the right way to update it:
    // dependents.devDependencies[pkg.name]?.forEach((dependent) => {
    //   cascade({ pkg: dependent, targetDiffType: 'patch' + (prerelease ? '-' + prerelease : ''), dependents, graph })
    // })
  }
}

function targetUpdate (targetPkg, targetVersion, graph) {
  const { version } = semver.parse(targetVersion)
  
  const targetDiffType = diff(targetPkg.version.pending, version)
  const dependents = inverseDependencyGraph(graph)

  cascade({ pkg: targetPkg, targetDiffType, dependents, graph })
  return graph
}

function commit (graph) {
  getPackages().forEach(({ file, contents }) => {
    const pkg = graph[contents.name]
    const filepath = resolve('.', file)
    if (pkg && pkg.versionDiff) {
      writeFile(filepath, pkg.toString() + '\n', (err) => {
        if (err) {
          console.error(err)
        } else {
          console.log(file, 'updated successfully.')
        }
      })
    }
  })
}

module.exports = {
  getPackages,
  buildGraph,
  identifyOutOfSync,
  targetUpdate,
  commit,
}
