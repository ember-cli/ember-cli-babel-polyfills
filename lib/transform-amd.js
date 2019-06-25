const Filter = require('broccoli-persistent-filter');
const path = require('path');

const preamble = `
var BABEL_POLYFILL_MODULES = {};

function __babelPolyfillDefine(name, requires, module) {
	var exports = {}
	var resolved = requires.map(function(require) {
		return require === 'exports' ? exports : BABEL_POLYFILL_MODULES[require];
	});

  module.apply(null, resolved);
	BABEL_POLYFILL_MODULES[name] = exports;
}
`;

const DEFINE_REGEXP = /define\(\['[^']+'\],\s*function/;

module.exports = class TransformAmd extends Filter {
  processString(contents, relativePath) {
    let file = path.basename(relativePath);

    if (DEFINE_REGEXP.test(contents) === false) {
      throw new Error(`ember-cli-babel-polyfills: unable to remap: ${file}`);
    }

    if (file === 'evergreen.js' || file === 'legacy.js') {
      return contents.replace(DEFINE_REGEXP,
        `__babelPolyfillDefine('${file}', ['shared.js'], function`
      );
    }

    return (
      preamble +
      contents.replace(
        DEFINE_REGEXP,
        `__babelPolyfillDefine('shared.js', ['exports'], function`
      )
    );
  }
};
