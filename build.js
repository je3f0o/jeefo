/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : build.js
* Created at  : 2016-09-01
* Updated at  : 2016-09-01
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

"use strict";

var fse    = require("fs-extra"),
	uglify = require("uglify-js");

var _package = require("./package");

var VERSION      = _package.version,
	LIBRARY_NAME = _package.name;

var header = "/*\n jeefo v__VERSION__\n (c) 2016 jeefo <je3f0o@gmail.com>. https://github.com/je3f0o/jeefo\n License: MIT\n*/\n".
	replace("__VERSION__", VERSION);

var IGNORE_REGEX = /\/\/ignore\:start(?:(?!\/\/ignore\:end)[.\s\S])+.*\n/ig;
var EXPORT_REGEX = /\/\*\s*exported\s?([^*]+)\*\//i;

var universal_module_definition = function (scope, factory) {
	// jshint strict:false
	if (typeof exports === "object") {
		module.exports = factory();
	} else {
		scope.LIBRARY_NAME = factory();
	}
}.toString().replace("LIBRARY_NAME", LIBRARY_NAME);
var compiled_source = '(MODULE(this, function () { "use strict";\n\n__SOURCE__\nreturn {\n__EXPORTS__\n};\n\n}));'.
	replace("MODULE", universal_module_definition);

var get_filesize  = function (path) {
	return fse.statSync(path).size;
};

var source_files = require("./source_files");

var exports = [];
var source = source_files.map(function (file) {
	var ignore;
	var code = fse.readFileSync('./0'.replace(0, file), "utf8").
		replace(IGNORE_REGEX, function ($1) {
			if (! ignore) {
				ignore = $1;
			}
			return '';
		});

	if (ignore) {
		var _export = ignore.match(EXPORT_REGEX);
		if (_export) {
			_export = _export[1].split(/\s*,\s*/);
			exports = exports.concat(_export);
		}
	}

	return code;
}).join("\n\n");

// Compile

var compile_export = function (exports) {
	exports = exports.map(function (_export) {
		_export = _export.trim();
		return _export ? "\t0 : 0".replace(/0/g, _export) : '';
	}).filter(function (_export) {
		return _export;
	});
	exports.unshift('\tversion : "0"'.replace(0, VERSION));

	return exports.join(",\n");
};

var compile = function () {
	exports = compile_export(exports);
	return compiled_source.replace("__SOURCE__", source).replace("__EXPORTS__", exports);
};
compiled_source = compile();

var result = uglify.minify(compiled_source, {
	mangle   : { toplevel : true },
	compress : { unused : false },
	fromString : true,
});


// Final step
var output_filename   = "./jeefo.js";
var minified_filename = "./jeefo.min.js";

compiled_source   = header + compiled_source;
var minified_code = header + result.code;

fse.outputFileSync(output_filename, compiled_source);
fse.outputFileSync(minified_filename, minified_code);

console.log("Compiled source: 0 bytes.".replace(0, get_filesize(output_filename)));
console.log("Minified: 0 bytes.".replace(0, get_filesize(minified_filename)));
