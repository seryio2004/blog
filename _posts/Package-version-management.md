---
title: "Package-version-management"
section: "Python"
language: "en"
excerpt: "En este articulo se explicara brevemente la herramienta uv, si usas o conoces pip este articulo te sera muy util"
coverImage: "/assets/blog/guia_runners/runner.jpg"
date: "2026-08-26T05:35:07.322Z"
author:
  name: Nigi nigez
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---



# Package version management

For this guide on managing Python package versions, Semantic Versioning (SemVer) will be used as the basis for versioning.

# Basic concepts

The classic versioning scheme is:

MAJOR.MINOR.PATCH

```bash
0.1.0

0.1.1

0.2.0

1.0.0
```

Each number has a meaning; from right to left it would be:

**PATCH:** fixes that do not break compatibility with previous versions 1.2.4 → 1.2.5  

**MINOR:** new features compatible with everything that already exists 1.2.4 → 1.3.0  

**MAJOR:** changes incompatible with previous versions 1.3.0 → 2.0.0

# When to create a new version

A release is created when you have a project state that is considered **installable, identifiable, and reusable.**

Imagine you find a bug and you make different commits to fix it. When you manage to fix it and you push a change that simply fixes that small bug, then you would update the PATCH.

After that bug, you decide to add a new feature that does not affect the normal operation of the system, then we would change the MINOR version.

If you want to change the parameters of functions that are used in other repositories, making it so you must modify the repositories that depend on what you just changed, it would be considered a big change that causes incompatibility, so the MAJOR version is changed.

A frequent question is when version 1.0.0 should be released. For that, I will simply quote the SemVer website:

> If your software is being used in production, it should probably already be 1.0.0. If you have a stable API on which users depend, you should be 1.0.0. If you're worried a lot about backwards compatibility, you should probably already be 1.0.0.
> 

# PEP 404: Python versions

In addition to the system above, Python has its own versioning system that defines how versions should be written.

Formats such as these are allowed:

```bash
1.0.0

1.1.0

2.0.1
```

But it also allows development versions:

```bash
1.2.0a1
1.2.0b1
1.2.0rc1
1.2.0
```

Where they represent:

```bash
a -> alpha
b -> beta
rc -> release candidate
standard format -> stable release
```

These nomenclatures are not strictly necessary, and in small developments they may not be the most convenient, so their use is purely stylistic.

# Package version + Git tag

This practice is highly recommended: each version that is published (the code is packaged for use in other repositories) should have an equivalent Git tag associated with it.

**Git tag** → labels that point to a specific commit, usually relevant moments in the project.

This allows us to know which code generated package v0.3.0.

To create a Git tag, the first thing is to have the commit done and pushed to main/master; afterwards you only need to run the following command:

```bash
git tag -a v0.2.0 -m "COMMIT_NAME"
```

That will create:

```bash
commit abc123
    ↑
  v0.2.0
```

And lastly you have to push the tag to Forgejo with:

```bash
git push origin v0.2.0
```

> Normally a `git push` does not automatically push tags, so `git push origin v0.2.0` is used explicitly.
> 

# How to specify dependencies

You can pin an exact version such as: `"kreios-environment==0.3.1"`

But this format will not automatically receive bug fixes.

So it is much more recommended to use MINOR version ranges, e.g.: `"kreios-environment>=0.3.1,<0.4"`

# Changelog

Since the packages we use are private packages, it is recommended to have a log of the changes that each version implements. It is very useful for people who want to add a package as a dependency; with this log, doubts such as “Can I update from `0.2.1` to `0.3.0`?” will be cleared up, and similar questions.

A possible format for this log would be:

```bash
# Changelog

## 0.3.0

### Added

- Added NRLMSISE atmospheric model.
- Added configurable solar activity.

### Changed

- Improved atmospheric interpolation.

### Fixed

- Fixed density calculation above 500 km.

## 0.2.1

### Fixed

- Fixed invalid temperature interpolation.

## 0.2.0

### Added

- Initial atmospheric interpolation support.
```

# Keep in mind

1. Software that uses semantic versioning MUST declare a public API. This API can be declared in the code itself or exist exclusively in the documentation. Whatever the method, it MUST be precise and complete.
2. Once a package version has been published, the contents of that version MUST NOT be modified. Any modification MUST be published as a new version.
3. Version 1.0.0 defines the public API. How the version number is incremented after this release depends on this public API and how it changes.

# Sources

[semver](https://semver.org/)

[pep404](https://peps.python.org/pep-0440/)