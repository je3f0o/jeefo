/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : path_resolver_specs.js
* Created at  : 2018-12-17
* Updated at  : 2018-12-17
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var path          = require("path"),
	expect        = require("expect"),
	path_resolver = require("../../src/parser/path_resolver");

var dirname       = 'src';
var required_path = "./colors.js";

path_resolver.set_basedir(process.cwd());

describe("Path resolver", () => {
	it("Should be normalized", () => {
		var file = path_resolver(dirname, required_path);

		if (path.sep === '/') {
			expect(file.path, "src/colors.js");
		} else {
			expect(file.path, "src\\colors.js");
		}
	});
});
