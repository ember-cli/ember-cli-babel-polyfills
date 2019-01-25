import { module, test } from 'qunit';

import { isIE, isEdge, isChrome, isFirefox, isSafari } from '../helpers/browser-detection';

module('polyfill', function() {
  if (isIE) {
    module('legacy', function() {
      test('it loads', function(assert) {
        // we will load all modules in legacy, but the evergreen module is
        // mostly/fully empty
        assert.ok(
          window.BABEL_POLYFILL_MODULES !== undefined
          && window.BABEL_POLYFILL_MODULES['shared.js'] !== undefined
          && window.BABEL_POLYFILL_MODULES['legacy.js'] !== undefined
          && window.BABEL_POLYFILL_MODULES['evergreen.js'] !== undefined,
          'polyfill was loaded'
        );
      });

      test('it works', function(assert) {
        assert.ok(typeof Symbol !== 'undefined', 'Symbol exists');
      });
    });
  } else {
    module('evergreen', function() {
      test('it loads', function(assert) {
        assert.ok(
          window.BABEL_POLYFILL_MODULES !== undefined
          && window.BABEL_POLYFILL_MODULES['shared.js'] !== undefined
          && window.BABEL_POLYFILL_MODULES['evergreen.js'] !== undefined,
          'polyfill was loaded'
        );

        assert.ok(
          window.BABEL_POLYFILL_MODULES['legacy.js'] === undefined,
          'legacy polyfill was not loaded'
        );
      });

      if (isChrome || isFirefox || isSafari) {
        test('it works', function(assert) {
          // https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate
          //
          // setImmediate exists in IE, and still exists in Edge. May be why they chose
          // polyfill in other browsers despite being non-standard. We should add a lint
          // rule preventing people from using, but seems like a good signal the the
          // polyfill was included correctly for now.
          assert.ok(typeof window.setImmediate === 'function', 'setImmediate exists');
        });
      }

      if (isEdge) {
        test('it works', function(assert) {
          // This test will eventually stop working once dom iterable is
          // available in Edge.
          assert.ok(document.forms[Symbol.iterator], 'DOM Iterables are iterable');
        });
      }
    });
  }
})
