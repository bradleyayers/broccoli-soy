# broccoli-soy

The broccoli-soy compiles Soy / [Closure Templates](https://developers.google.com/closure/templates/)
to JavaScript.

This plugin is designed to compile 1:1, primary input file into a single output file,
however it supports glob patterns to target multiple files easily.

## Installation

```bash
npm install --save-dev broccoli-soy
```

## Usage

```js
var soy = require('broccoli-soy');

var outputTree = soy(sourceTree, options);
```

* **`sourceTree`**: A tree that act as the search path for `options.files`.

* **`options.compiler`**: Path to `SoyToJsSrcCompiler.jar`.

* **`options.files`**: Array of node glob patterns to search for files. 

* **`options.options`**: (optional) A hash of options for `SoyToJsSrcCompiler.jar`.

### Example

```js
var templates = soy("src", {
  files: ["**/*.soy"],
  compiler: path.resolve(__dirname, "lib/closure-templates-for-javascript-latest/SoyToJsSrcCompiler.jar")
});
```
