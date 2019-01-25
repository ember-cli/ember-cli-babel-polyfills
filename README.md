ember-cli-babel-polyfills
==============================================================================

This addon automatically includes a split build of the Babel polyfills in your
Ember application! This includes three files that are added programmatically
to your `index.html`:

1. `polyfill-shared.js`
3. `polyfill-evergreen.js`
2. `polyfill-legacy.js`

The shared file contains the common code between both polyfills, while the
others contain whatever is unique to them. Importantly, the `polyfill-legacy`
file (which is usually the largest!) is marked with the `nomodule` attribute.
This attribute _prevents the file from loading_ in all modern browsers, so it
only impacts your legacy users. For more details, see the
[MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-nomodule).

### Why would I want an evergreen polyfill?

It turns out that browsers almost always have inconsistencies, even when they
aren't updating only once-per-Windows-release! For instance, Microsoft Edge does
not yet implement the DOM iterable API as of 01/24/19 (try checking for
`document.forms[Symbol.iterator]` in the developer console).

These polyfills are built dynamically using Babel's presetEnv, so they'll stay
up to date even as the browsers themselves are changing. Best of all, you only
ship the things you care about to modern browsers!

Installation
------------------------------------------------------------------------------

```
ember install ember-cli-babel-polyfills
```


Usage
------------------------------------------------------------------------------

Installing the addon will automatically include the polyfills without any
additional configuration. You can opt to configure the addon with the following
options:

```ts
interface EmberCliBabelPolyfillsConfig {
  legacyTargets?: string[];
  evergreenTargets?: string[];
  includeScriptTags?: boolean;
}
```

### `evergreenTargets`

The evergreen browsers you want to support, provided in
[browserslist](https://github.com/browserslist/browserslist) format. Defaults
to the following:

```js
const evergreenTargets = [
  'last 2 Chrome versions',
  'last 2 Firefox versions',
  'last 2 Safari versions',
  'last 2 Edge versions',
  'last 2 ChromeAndroid versions',
  'last 2 iOS versions',
]
```

Example Usage:

```js
// ember-cli-build.js

let app = new EmberApp(defaults, {
  'ember-cli-babel-polyfills': {
    evergreenTargets: [
      'last 1 Chrome versions',
      'last 1 Firefox versions',
      'last 1 Safari versions',
    ],
  },
});
```

### `legacyTargets`

The legacy browsers you want to support, provided in
[browserslist](https://github.com/browserslist/browserslist) format. Defaults
to your app's targets.

Example Usage:

```js
// ember-cli-build.js

let app = new EmberApp(defaults, {
  'ember-cli-babel-polyfills': {
    legacyTargets: [
      "last 1 version",
      "> 1%",
      "maintained node versions",
      "not dead",
    ],
  },
});
```

### `includeScriptTags`

Whether or not the addon should inject script tags into your content for `body`.
Defaults to `true`.

Example Usage:

```js
// ember-cli-build.js

let app = new EmberApp(defaults, {
  'ember-cli-babel-polyfills': {
    includeScriptTags: false,
  },
});
```

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
