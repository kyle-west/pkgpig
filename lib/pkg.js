const semver = require('semver');
const { inc, diff } = require('./util');

function flattenDeps (deps = [], original = {}) {
  const flat = {
    ...original, 
    ...Object.fromEntries(
      deps.map((pkg) => pkg.version.pending && [pkg.name, '^' + pkg.version.pending])
        .filter(Boolean)
    )
  }
  return Object.keys(flat).length > 0 ? flat : undefined
}

class Pkg {
  constructor(contents = {}) {
    const { name, version } = contents
    this.name = name;
    this.version = { original: version, pending: version };
    this._contents = contents;
  }

  inc (type) {
    this.version.pending = inc(this.version.original, type)
  }

  get versionDiff () {
    return diff(this.version.original, this.version.pending)
  }

  buildDepList(graph) {
    const { dependencies, devDependencies, peerDependencies } = this._contents
    const link = name => graph[name]
    this.dependencies = dependencies && Object.keys(dependencies).map(link).filter(Boolean)
    this.devDependencies = devDependencies && Object.keys(devDependencies).map(link).filter(Boolean)
    this.peerDependencies = peerDependencies && Object.keys(peerDependencies).map(link).filter(Boolean)
  }

  flatten() {
    return { 
      ...this._contents, 
      version: this.version.pending,
      dependencies: flattenDeps(this.dependencies, this._contents.dependencies),
      peerDependencies: flattenDeps(this.peerDependencies, this._contents.peerDependencies),
      devDependencies: flattenDeps(this.devDependencies, this._contents.devDependencies),
    }
  }

  toString(level = 2) {
    return JSON.stringify(this.flatten(), null, level)
  }

  needsMajorUpdateIfConsumedFlat (checkPeers = true) {
    const majorDeps = this.dependencies?.some((dep) => !semver.satisfies(dep.version.pending, this._contents.dependencies[dep.name]))
    const majorPeer = checkPeers && this.peerDependencies?.some((dep) => !semver.satisfies(dep.version.pending, this._contents.peerDependencies[dep.name]))
    return majorDeps || majorPeer
  }
}

function makeDependencyGraph (packages) {
  const graph = {};
  packages.forEach(({ contents }) => {
    if (contents.name && contents.version) {
      graph[contents.name] = new Pkg(contents);
    }
  })
  Object.values(graph).forEach((pkg) => {
    pkg.buildDepList(graph)
  })
  return graph
}

function inverseDependencyGraph (graph) {
  const dependencies = {}
  const peerDependencies = {}
  const devDependencies = {}
  Object.entries(graph).forEach(([name, pkg]) => {
    pkg.dependencies?.forEach(dep => {
      dependencies[dep.name] = dependencies[dep.name] || []
      dependencies[dep.name].push(graph[name])
    })
    pkg.peerDependencies?.forEach(dep => {
      peerDependencies[dep.name] = peerDependencies[dep.name] || []
      peerDependencies[dep.name].push(graph[name])
    })
    pkg.devDependencies?.forEach(dep => {
      devDependencies[dep.name] = devDependencies[dep.name] || []
      devDependencies[dep.name].push(graph[name])
    })
  })
  return {
    dependencies,
    peerDependencies,
    devDependencies,
  }
}

module.exports = {
  Pkg,
  makeDependencyGraph,
  inverseDependencyGraph,
}