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

module.exports = class TransformAmd extends Filter {
  processString(contents, relativePath) {
    let file = path.basename(relativePath);

    if (file === 'evergreen.js' || file === 'legacy.js') {
      return contents.replace(
        /define\(\['[.\w/\\]*?'\],/,
        `__babelPolyfillDefine('${file}', ['shared.js'],`
      );
    }

    return (
      preamble +
      contents.replace(
        /define\(\['[.\w/\\]*?'\],/,
        `__babelPolyfillDefine('shared.js', ['exports'],`
      )
    );
  }
};
