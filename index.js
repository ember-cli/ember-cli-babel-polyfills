'use strict';

const VersionChecker = require('ember-cli-version-checker');
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const fs = require('fs');

const DEFAULT_OPTIONS = {
  includeScriptTags: true,
  legacyTargets: null,
  evergreenTargets: [
    'last 2 Chrome versions',
    'last 2 Firefox versions',
    'last 2 Safari versions',
    'last 2 Edge versions',
    'last 2 ChromeAndroid versions',
    'last 2 iOS versions',
  ],
};

module.exports = {
  name: require('./package').name,

  included() {
    this._super.included.apply(this, arguments);

    let parent = this.parent;
    let host = this._findHost();

    let parentOptions = (parent.options || {})['ember-cli-babel-polyfills'];
    let hostOptions = (host.options || {})['ember-cli-babel-polyfills'];

    this._options = Object.assign(
      {},
      DEFAULT_OPTIONS,
      parentOptions,
      hostOptions
    );

    let checker = new VersionChecker(this.project);

    if (!checker.for('ember-cli-babel').gte('7.0.0')) {
      throw new Error(
        'ember-cli-babel-polyfill only supports Babel 7+, attempted to use it with an earlier version'
      );
    }

    this.import('vendor/ember-cli-babel-polyfills/shared.js', {
      outputFile: 'assets/polyfill-shared.js',
    });

    this.import('vendor/ember-cli-babel-polyfills/legacy.js', {
      outputFile: 'assets/polyfill-legacy.js',
    });

    this.import('vendor/ember-cli-babel-polyfills/evergreen.js', {
      outputFile: 'assets/polyfill-evergreen.js',
    });
  },

  treeForVendor() {
    let Rollup = require('broccoli-rollup');
    let resolve = require('rollup-plugin-node-resolve');
    let commonjs = require('rollup-plugin-commonjs');

    let writeFile = require('broccoli-file-creator');
    let TransformAmd = require('./lib/transform-amd');

    let legacyTargets = this._options.legacyTargets || this.project.targets;
    let evergreenTargets = this._options.evergreenTargets;

    let basedir = this.project.root;

    let corejsVersion = JSON.parse(
      fs.readFileSync(
        require('resolve').sync('core-js/package.json', {
          basedir,
        })
      )
    ).version.split('.')[0];

    let entries = new MergeTrees([
      writeFile(
        'legacy.js',
        this._getEntryForTargets(legacyTargets, corejsVersion)
      ),
      writeFile(
        'evergreen.js',
        this._getEntryForTargets(evergreenTargets, corejsVersion)
      ),
    ]);

    let rolledUp = new Rollup(entries, {
      rollup: {
        experimentalCodeSplitting: true,
        input: ['legacy.js', 'evergreen.js'],
        output: {
          dir: 'output',
          format: 'amd',
        },
        plugins: [
          resolve({
            customResolveOptions: {
              basedir,
            },
          }),
          commonjs(),
        ],
      },
    });

    return new Funnel(new TransformAmd(rolledUp), {
      srcDir: 'output',
      destDir: 'ember-cli-babel-polyfills',
      getDestinationPath(path) {
        return path !== 'legacy.js' && path !== 'evergreen.js'
          ? 'shared.js'
          : path;
      },
    });
  },

  _getEntryForTargets(targets, corejs) {
    // eslint-disable-next-line node/no-extraneous-require
    let babel = require('@babel/core');
    let presetEnvPath = require.resolve('@babel/preset-env');

    return babel.transform(
      'import "core-js/stable";import "regenerator-runtime/runtime";',
      {
        presets: [
          [
            presetEnvPath,
            {
              targets,
              useBuiltIns: 'entry',
              corejs,
            },
          ],
        ],
      }
    ).code;
  },

  contentFor(type, { rootURL }) {
    let forceInclude = process.env.TEST_FORCE_INCLUDE_LEGACY_SCRIPT;

    if (this._options.includeScriptTags && type === 'body') {
      return `
        <script src="${rootURL}assets/polyfill-shared.js"></script>
        <script src="${rootURL}assets/polyfill-legacy.js" ${
        forceInclude ? '' : 'nomodule'
      }></script>
        <script src="${rootURL}assets/polyfill-evergreen.js"></script>
      `;
    }
  },
};
