const { execSync } = require('child_process')
const semver = require('semver');

function inc (version, type) {
  let [ baseType, prerelease ] = type.split('-');

  if (baseType === 'prerelease') {
    if (prerelease.startsWith('pre') && version.startsWith('0')) {
      const releaseType = prerelease.substring(3)
      return semver.inc(version, 'prerelease', releaseType)
    }
    return semver.inc(version, 'prerelease', prerelease)
  }

  if (prerelease) {
    if (prerelease.startsWith('pre')) {
      const releaseType = prerelease.substring(3)
      if (version.startsWith('0')) {
        if (baseType === 'minor') baseType = 'patch'
        if (baseType === 'major') baseType = 'minor'
        if (releaseType) {
          return semver.inc(version, `pre${baseType}`, releaseType)
        } else {
          return semver.inc(version, baseType)
        }
      } else {
        if (releaseType) {
          return semver.inc(version, `pre${baseType}`, releaseType)
        } else {
          return semver.inc(version, baseType)
        }
      }
    }
    return semver.inc(version, `pre${baseType}`, prerelease)
  }

  return semver.inc(version, baseType)
}

function diff (version1, version2) {
  const diff = semver.diff(version1, version2)
  if (!diff) return diff

  if (diff === 'prerelease' && semver.lt(version1, version2) && semver.parse(version2).prerelease.length === 0) {
    return 'major'
  }

  const v2 = semver.parse(version2);
  if (v2.major === 0) {
    let zeroVersion = diff
    if (diff.includes('minor')) zeroVersion = 'major-pre';
    if (diff.includes('patch')) zeroVersion = 'minor-pre';
    if (diff.startsWith('pre')) {
      if (diff === 'prerelease') {
        return diff + '-pre' + v2.prerelease[0]
      } else {
        return zeroVersion + v2.prerelease[0]
      }
    }
    return zeroVersion
  }
  if (diff.startsWith('pre')) {
    if (diff === 'prerelease') {
      return diff + '-' + v2.prerelease[0]
    } else {
      return diff.substring(3) + '-' + v2.prerelease[0]
    }
  }
  return diff
}

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
  inc,
  diff,
}