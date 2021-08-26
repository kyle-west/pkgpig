# 🐷 pkgpig

_WIP: This is a refactor of some other CLI I wrote. Hopefully there are no bugs. But if so please [report it on GitHub](https://github.com/kyle-west/pkgpig/issues). Thank you for your patience._

![Status Badge](https://github.com/kyle-west/pkgpig/workflows/Install%20and%20Test%20Flow/badge.svg)

Manage semantic versioning in a monorepo context. 

This tool is _opinionated_. Mostly, the opinion is that historically people are secretly bad at semantic versioning (often a secret to even them). They may claim otherwise, but that's only because they haven't critically broken anyone's stuff yet.

SemVer can't stop problems like side-effects, hidden dependencies, `React.context` mismatches, build-origin closures, and more. That's why as a policy:
> `pkgpig` implements the rule that if an internal package bumps a major version, then all packages dependent on it get major bumped too (and their dependents, and so on).

This policy is an extension of SemVar. It prevents the footguns mentioned. Admittedly, it can be annoying at times - but it is far less of a headache to manage for your consumers than mal-versioned packages. Unless you _really_ know what you are doing, just let the tool do its job (even then, you should probably trust it anyway).

## Install

It's a global CLI. Node 14+ (but 12 might work too - not tested yet).

```
npm i -g pkgpig
```

## CLI

### `sync`

Wizard to walk you through updating your monorepo's internal dependencies. It will allow you to:

- Prepare new version releases, including the ramifications of releasing new packages may have on the others
- View out of sync `@your-org` packages
- Update `@your-org` packages to use the most current versions of each other

```
pkgpig sync
```

_CLI shortcuts to the `sync` options coming in a later version_

### `graph`

Output the inverse dependency graph for the current monorepo. (What `@your-org` packages are dependent on a given package)

```
pkgpig graph [packageNames...]
```

Will output something of the order
```
@your-org/form is depended on by: 
  as a dependency:       @your-org/login-dialog  @your-org/subscribe-form
  as a devDependency:    @your-org/ui

@your-org/ui is depended on by: 
  as a peerDependency:   @your-org/form  @your-org/login-dialog  @your-org/subscribe-form
...
```

## Contributing

Run the following to test / dev locally:
```
npm install
npm link
```

## Authorship

Created, with love, by [@KyleWestCS](https://twitter.com/KyleWestCS)
