/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-04-29
* Updated at  : 2017-05-07
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported */
/* exported */

//ignore:end

var fse             = require("fs-extra"),
	path            = require("path"),
	uglify          = require("uglify-js"),
	_package        = require("../package"),
	preprocessor    = require("./preprocessor"),
	header_compiler = require("./header_compiler");

var get_filesize  = function (path) {
	return fse.statSync(path).size;
};

var source_files = require("../source_files");

var source = source_files.map(function (file) {
	return preprocessor(file, 
		fse.readFileSync(`./${ file }`, "utf8")
	).trim();
}).join("\n\n");

// Compile

var license = `The ${ _package.license } License`;
var header = header_compiler({
	[_package.name] : `v${ _package.version }`,
	Author          : `${ _package.author.name }, <${ _package.author.email }>`,
	Homepage        : _package.homepage,
	License         : license,
	Copyright       : _package.copyright
});

var browser_source = `(function () {"use strict";var jeefo=(function(){ ${ source } }()); window.jeefo = jeefo.create(); }());`;
var node_source    = `${ header }\n"use strict";\n\nmodule.exports = (function () {\n\n${ source }\n\n}());`;
var node_min_source;

browser_source  = header + uglify.minify(browser_source, _package.uglify_config).code;
node_min_source = header + uglify.minify(node_source, _package.uglify_config).code;

// Final step
var output_filename   = path.resolve(__dirname, `../dist/${ _package.name }.js`);
var node_filename     = path.resolve(__dirname, `../dist/${ _package.name }.node.js`);
var node_min_filename = path.resolve(__dirname, `../dist/${ _package.name }.node.min.js`);
var browser_filename  = path.resolve(__dirname, `../dist/${ _package.name }.min.js`);


fse.outputFileSync(output_filename, `${ header }\n\n${ source }`);
fse.outputFileSync(node_filename, node_source);
fse.outputFileSync(node_min_filename, node_min_source);
fse.outputFileSync(browser_filename, browser_source);

console.log(`Raw source: ${ get_filesize(output_filename) } bytes.`);
console.log(`Node source: ${ get_filesize(node_filename) } bytes.`);
console.log(`Node min source: ${ get_filesize(node_min_filename) } bytes.`);
console.log(`Browser source: ${ get_filesize(browser_filename) } bytes.`);

// License {{{1
license = `${ license }

Copyright (c) ${ _package.copyright } - ${ _package.name }, ${ _package.homepage }

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.`;

var license_path = path.resolve(__dirname, "../LICENSE");
fse.outputFileSync(license_path, license);
// }}}1
