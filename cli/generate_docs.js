/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : generate_docs.js
* Created at  : 2017-09-21
* Updated at  : 2019-01-10
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var pp             = require("jeefo_preprocessor").es6.clone(),
	fse            = require("fs-extra"),
	path           = require("path"),
	parse          = require("./generate_docs/parse"),
	path_resolve   = require("../src/parser/path_resolver"),
	require_parser = require("../src/parser/require_parser");

var DOC_REGEX = /\@doc/i;

pp.actions.register("Comment", function (_pp, token) {
	if (DOC_REGEX.test(token.comment)) {
		_pp.state.docs.push(token.comment);
	}
});

var assignment_expression = pp.actions.handlers.AssignmentExpression;

pp.actions.register("AssignmentExpression", function (_pp, token) {
	if (token.left.type === "MemberExpression" &&
		token.left.object.name === "module" &&
		token.left.property.name === "exports") {
		_pp.state.exports.push({ type : "default", interface : parse(token.right) });
	}

	return assignment_expression(_pp, token);
});

/**
 * @doc
 * @type  : Function
 * @name  : export_docs
 *
 * @param : (String) filepath
 * @param : (String) source_code
 */
var export_docs = function (filepath, source_code) {
	pp.state = {
		docs     : [],
		exports  : [],
		filepath : filepath,
	};

	pp.process(filepath, source_code);

	return pp.state;
};

module.exports = {
	name    : "generate-apis",
	aliases : ['ga'],
	options : [
		{ name : "main"    , type : "String" , default : "index.js" , aliases : ['m'] } ,
		{ name : "name"    , type : "String" , default : "unknown"  , aliases : ['n'] } ,
		{ name : "version" , type : "String" , default : "0.0.0"    , aliases : ['v'] } ,
	],
    description : "Export documantations",
    execute : function (options) {
		var result = { API : [] };
		var basedir = process.cwd();
		path_resolve.set_basedir(basedir);

		var main = path_resolve('.', `./${ options.main }`);

		if (main.__dirname !== '.') {
			basedir = path.join(basedir, main.__dirname);
			path_resolve.set_basedir(basedir);

			main.__dirname = '.';
		}
		var cache = require_parser(main, {});

		Object.keys(cache).forEach(function (filepath) {
			result.API.push(export_docs(filepath, cache[filepath].content));
		});

		// name, version
		try {
			var pkg = require(path.join(basedir, "package.json")),
				version = pkg.version.split('.');

			result.name    = pkg.name;
			result.version = {
				major : version[0],
				minor : version[1],
				micro : version[2],
			};
		} catch (e) {}

		fse.outputJsonSync("api.json", result, { spaces : 2 });
	}
};
