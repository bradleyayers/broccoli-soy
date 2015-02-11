var fs = require('fs');
var path = require('path');
var mergeTrees = require('broccoli-merge-trees');
var includePathSearcher = require('include-path-searcher');
var helpers = require('broccoli-kitchen-sink-helpers');
var CachingWriter = require('broccoli-caching-writer');
var _ = require('lodash');
var spawnSync = require('child_process').spawnSync;

module.exports = SoyCompiler;

function regexQuote(str) {
  return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}

function SoyCompiler(inputTree, options) {
  if (!(this instanceof SoyCompiler)) {
    return new SoyCompiler(inputTree, options);
  }

  this.inputTree = inputTree;
  this.files = options.files;
  this.compiler = options.compiler;
  this.compilerOptions = options.options || {};
  this._singleFileSoyCompilerCache = {};
}

SoyCompiler.prototype.read = function (readTree) {
  var self = this;
  return readTree(this.inputTree)
      .then(function (inputPath) {
        var files = helpers.multiGlob(self.files, {
          cwd: inputPath,
          root: inputPath,
          nomount: false
        });

        var compiledTrees = files.map(function (file) {
          // Reuse trees for files that we've seen before, so they can cache effectively.
          if (!self._singleFileSoyCompilerCache.hasOwnProperty(file)) {
            self._singleFileSoyCompilerCache[file] = SingleFileSoyCompiler(self.inputTree, file, self.compiler, self.compilerOptions);
          }
          return self._singleFileSoyCompilerCache[file];
        });

        return readTree(mergeTrees(compiledTrees, {overwrite: true}));
      })
};

SoyCompiler.prototype.cleanup = function () {};


function SingleFileSoyCompiler (inputTree, inputFile, compiler, options) {
  if (!(this instanceof SingleFileSoyCompiler)) {
    return new SingleFileSoyCompiler(inputTree, inputFile, compiler, options);
  }

  CachingWriter.call(this, inputTree, {
    filterFromCache: {
      include: [new RegExp(regexQuote(inputFile))]
    }
  });

  this.inputFile = inputFile;
  this.compiler = compiler;
  this.compilerOptions = options;
}

SingleFileSoyCompiler.prototype = Object.create(CachingWriter.prototype);
SingleFileSoyCompiler.prototype.constructor = SingleFileSoyCompiler;

SingleFileSoyCompiler.prototype.updateCache = function (srcDir, destDir) {
  var srcFile = includePathSearcher.findFileSync(this.inputFile, srcDir);
  var compilerOptions = _.extend(this.compilerOptions, {
    outputPathFormat: path.join(destDir, "{INPUT_DIRECTORY}{INPUT_FILE_NAME}.js")
  });
  var extra_args = [];
  Object.keys(compilerOptions).forEach(function (key) {
    extra_args.push("--" + key);
    extra_args.push(compilerOptions[key]);
  });
  spawnSync("java", ["-jar", this.compiler, "--srcs", srcFile].concat(extra_args));
};
