/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : require_parser.js
* Created at  : 2017-09-21
* Updated at  : 2017-09-22
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var pp           = require("jeefo_preprocessor").es6.clone(),
	fse          = require("fs-extra"),
	path         = require("path"),
	config       = require("../config"),
	global_dir   = config.global_dir,
	resolve_path = require("./path_resolver"),
	cache, basedir;

var call_expression = pp.actions.handlers.CallExpression;

pp.actions.handlers.CallExpression = function (_pp, token) {
	var state    = _pp.state,
		requires = state.requires;

	if (token.callee.type === "Identifier" && token.callee.name === "require") {
		switch (token.arguments[0].type) {
			case "StringLiteral" :
				var file_path = token.arguments[0].value;
				if (file_path.charAt(0) !== '.') {
					return;
				}

				try {
					var file = resolve_path(state.__dirname, file_path, state.is_global);
					requires.push(file);

					if (file.path !== file_path) {
						return _pp.replace(token, `require("${ file.path }")`);
					}
				} catch (e) {
					console.log(state);
				}
				break;
			case "Identifier":
			case "CallExpression":
			case "TemplateLiteral":
			case "MemberExpression":
				break;
			default:
				console.log("=========================");
				console.log(token);
				console.log("=========================");
				console.log(state);
				console.log("=========================");
				console.log(_pp.code);
				process.exit();
		}
	} else {
		return call_expression(_pp, token);
	}
};

var parse_requires = function (file, script) {
	pp.state      = file;
	file.requires = [];

	var absolute_path = path.join(file.is_global ? global_dir : basedir, file.path);

	try {
		file.content = fse.readFileSync(absolute_path, "utf8");
	} catch (e) {
		console.log("NOT FOUND");
		console.log(absolute_path);
		console.log("-------------------");
		console.log(script);
		console.log("-------------------");
		console.log(file);
		process.exit();
	}
	file.content = pp.process(absolute_path, file.content);

	// Cache file
	cache[file.path] = file;

	file.requires = file.requires.map(function (required_file) {
		if (! cache[required_file.path]) {
			parse_requires(required_file, file);
		}
		return required_file.path;
	});
};

module.exports = function parser (file, _cache) {
	cache   = _cache;
	basedir = config.basedir;

	parse_requires(file);

	return _cache;
};
