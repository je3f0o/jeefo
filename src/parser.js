/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parser.js
* Created at  : 2016-11-26
* Updated at  : 2017-09-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* global */
/* exported */

// ignore:end

var pp             = require("jeefo_preprocessor").es6.clone(),
	fse            = require("fs-extra"),
	path           = require("path"),
	config         = require("./config"),
	global_dir     = config.global_dir,
	trim_lines     = require("./parser/trim_lines"),
	resolve_path   = require("./parser/path_resolver"),
	parse_comment  = require("./parser/parse_comment"),
	parse_register = require("./parser/parse_register"),
	jeefo_template = require("jeefo_template"),
	global_modules = config.global_modules,
	cache, basedir;

var call_expression = pp.actions.handlers.CallExpression;

pp.actions.handlers.TaggedTemplateLiteral = (_pp, token) => {
	switch (token.tag.name) {
		case "JT_PRE"     :
			// TODO:
			var r = trim_lines(_pp, token.template);
			return _pp.replace(token, `'${ jeefo_template(r.value.slice(1, -1)) }'`);
		case "TRIM_LINES" :
			var replace = trim_lines(_pp, token.template);
			return _pp.replace(token, replace.value);
		default:
			console.log(_pp.code);
			console.log(token);
			process.exit();
	}
};

pp.actions.handlers.CallExpression = (_pp, token) => {
	var state    = _pp.state,
		requires = state.requires;

	if (token.callee.type === "Identifier" && token.callee.name === "require") {
		switch (token.arguments[0].type) {
			case "StringLiteral" :
				var file_path = token.arguments[0].value;
				if (global_modules.indexOf(file_path) !== -1) {
					return;
				}

				var file = resolve_path(state.__dirname, file_path, state.is_global);
				requires.push(file);

				if (file.path !== file_path) {
					return _pp.replace(token, `require("${ file.path }")`);
				}
				break;
			case "Identifier":
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
	//console.log(absolute_path);
	file.content = pp.process(absolute_path, file.content);
	file.content = parse_comment(file.content);
	file.content = parse_register(file.path, file);

	// Cache file
	cache[file.path] = file;

	file.requires = file.requires.map(required_file => {
		if (! cache[required_file.path]) {
			parse_requires(required_file, file);
		}
		return required_file.path;
	});
};

module.exports = function parser (file) {
	cache   = config.cache;
	basedir = config.basedir;

	parse_requires(file);
};
