---
title: prepare a dart package for publishing in 5minutes
published: true
description: when publishing tests, coverage data, code formatting and builds are good practice to setup / prepare so that your package looks nice and shiny.
tags: dart, ci, package, build
---

When publishing a dart package [pub.dartlang.org](https://pub.dartlang.org/packages/valgene_cli) you should spend a minute and read [the recommendations from the dart team](https://www.dartlang.org/tools/pub/publishing) about publishing. However it makes sense to add a few more things to show up how nice your new package is and what awesome things it can do.

## dartanalyzer and code linting

use something like `dartanalyzer --fatal-warings lib/ bin/` to scan your code for issues.

## tests and coverage

Let's say you are familiar with tests and wrote tons of them, then it would be nice to collect this data and prepare a little batch at your README in your repo that shows the percentage. Just like this one [![Coverage Status](https://coveralls.io/repos/github/valgene/valgene-cli/badge.svg?branch=master)](https://coveralls.io/github/valgene/valgene-cli?branch=master)

to get there we use the *test_coverage* package, add it to your `pubspec.yaml`:

```yaml
dev_dependencies:
  test: ^1.4.0
  mockito: ^3.0.0
  test_coverage: ^0.2.0
```

Then you can run your tests with the command `pub run test_coverage`.
It will generate a small test in `test/.test_coverage.dart` that combines the execution of all your tests and coverage metrics will be collected during testing and stored at `coverage/lcov.info`.

### coverage as report

If you are curious about the coverage data use `genhtml -o coverage coverage/lcov.info` to generate a nice html report that is easy to view in a browser. But only locally.

For github I going to use the [coveralls](https://coveralls.io/) platform to generate the report and the nice badge. It's free and an account is easy to setup. Later more about this.

## dartfmt and nice readability

to the no issues with the standard code formatting rules better run `dartfmt -n --set-exit-if-changed lib/ test/ bin/` to check or `dartfmt -w lib/ test/ bin/` to reformat your code base. Tip to it early and every build.

# now lets automate this stuff

for this lets prepare a small Makefile that helps with this (shell scripts are also fine but I prefer make for small projects)

```make
DARTANALYZER_FLAGS=--fatal-warnings

build: lib/*dart test/*dart bin/*dart deps
	dartanalyzer ${DARTANALYZER_FLAGS} lib/ bin/
	dartfmt -n --set-exit-if-changed lib/ test/ bin/
	pub run test_coverage

deps: pubspec.yaml
	pub get

reformatting:
	dartfmt -w lib/ test/ bin/

build-local: reformatting build
	genhtml -o coverage coverage/lcov.info
	open coverage/index.html

publish:
	pub publish
```

small and handy. There you see build targets. The default one is the first and called `build` this will be used later on by travis to perform a build.

Locally you can run `make build-local` to get help also with the code reformatting and check the coverage report.

## Travis CI as build server

add a .travis.yml to your project:

```yaml
language: dart
dart:
  - stable
install:
  - gem install coveralls-lcov
script: make
after_success:
  - coveralls-lcov --repo-token $COVERALLS_TOKEN coverage/lcov.info
```

and go to [travis-ci.org](https://travis-ci.org) to setup and account and a project. There you can define a build variable `COVERALLS_TOKEN` that should contain the token you will get on coveralls.io (as described earlier).

## don't forget all the badges in your README

so the there is the build status, coverage and the pub version badge to add. Here I show the examples of my little tool [valgene](https://github.com/valgene/valgene-cli) just for demonstration.

```markdown
[![Build Status](https://travis-ci.org/valgene/valgene-cli.svg?branch=master)](https://travis-ci.org/valgene/valgene-cli#)
[![Coverage Status](https://coveralls.io/repos/github/valgene/valgene-cli/badge.svg?branch=master)](https://coveralls.io/github/valgene/valgene-cli?branch=master)
[![Pub](https://img.shields.io/pub/v/valgene_cli.svg)](https://pub.dartlang.org/packages/valgene_cli)
```
that will look then like this:
[![Build Status](https://travis-ci.org/valgene/valgene-cli.svg?branch=master)](https://travis-ci.org/valgene/valgene-cli#)
[![Coverage Status](https://coveralls.io/repos/github/valgene/valgene-cli/badge.svg?branch=master)](https://coveralls.io/github/valgene/valgene-cli?branch=master)
[![Pub](https://img.shields.io/pub/v/valgene_cli.svg)](https://pub.dartlang.org/packages/valgene_cli)

# finally publish your package

after all this commit, create tag, wait for a green build and then run `make publish` and you are done. Just published a nice and shiny dart package.

Enjoy and thanks for Reading