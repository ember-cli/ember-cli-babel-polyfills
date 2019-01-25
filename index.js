'use strict';

const VersionChecker = require('ember-cli-version-checker');
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

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

    let parentOptions = (this.parent.options || {})['ember-cli-babel-polyfills'];
    let appOptions = (this.app.options || {})['ember-cli-babel-polyfills'];

    this.options = Object.assign({}, DEFAULT_OPTIONS, parentOptions, appOptions);

    this._isBabel7 = new VersionChecker(this.project).for('ember-cli-babel').gte('7.0.0');

    this.app.import('vendor/ember-cli-babel-polyfills/shared.js', {
      outputFile: 'assets/polyfill-shared.js'
    });

    this.app.import('vendor/ember-cli-babel-polyfills/legacy.js', {
      outputFile: 'assets/polyfill-legacy.js'
    });

    this.app.import('vendor/ember-cli-babel-polyfills/evergreen.js', {
      outputFile: 'assets/polyfill-evergreen.js'
    });
  },

  treeForVendor() {
    let Rollup = require('broccoli-rollup');
    let resolve = require('rollup-plugin-node-resolve');
    let commonjs = require('rollup-plugin-commonjs');

    let writeFile = require('broccoli-file-creator');
    let TransformAmd = require('./lib/transform-amd');

    let legacyTargets = this.options.legacyTargets || this.project.targets;
    let evergreenTargets = this.options.evergreenTargets

    let entries = new MergeTrees([
      writeFile('legacy.js', this._getEntryForTargets(legacyTargets)),
      writeFile('evergreen.js', this._getEntryForTargets(evergreenTargets)),
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
          resolve(),
          commonjs(),
        ],
      },
    });

    return new Funnel(new TransformAmd(rolledUp), {
      srcDir: 'output',
      destDir: 'ember-cli-babel-polyfills',
      getDestinationPath(path) {
        return (path !== 'legacy.js' && path !== 'evergreen.js') ? 'shared.js' : path;
      },
    });
  },

  _getEntryForTargets(targets) {
    let babel = require(this._isBabel7 ? '@babel/core' : 'babel-core');
    let presetEnvPath = require.resolve(this._isBabel7 ? '@babel/preset-env' : 'babel-preset-env');

    return babel.transform(
      'import "@babel/polyfill";',
      {
        presets: [
          [presetEnvPath, { targets: this._getTargets(targets), useBuiltIns: 'entry' }],
        ],
      }
    ).code;
  },

  _getTargets(targets) {
    if (this._isBabel7) {
      return targets;
    }

    // eslint-disable-next-line node/no-extraneous-require
    let parser = require('babel-preset-env/lib/targets-parser').default;
    if (typeof targets === 'object' && targets !== null) {
      return parser(targets);
    } else {
      return targets;
    }
  },

  contentFor(type, { rootURL }) {
    if (this.options.includeScriptTags && type === 'body') {
      return `
        <script src="${rootURL}assets/polyfill-shared.js"></script>
        <script src="${rootURL}assets/polyfill-legacy.js" nomodule></script>
        <script src="${rootURL}assets/polyfill-evergreen.js"></script>
      `;
    }
  },
};
