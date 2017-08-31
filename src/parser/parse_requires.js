/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_requires.js
* Created at  : 2017-08-09
* Updated at  : 2017-08-31
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var pp             = require("jeefo_preprocessor").es6.clone(),
	fse            = require("fs-extra"),
	path           = require("path"),
	cache          = require("../cache"),
	config         = require("../config"),
	basedir        = config.basedir,
	global_dir     = config.global_dir,
	trim_lines     = require("./trim_lines"),
	resolve_path   = require("./path_resolver"),
	parse_comment  = require("./parse_comment"),
	parse_register = require("./parse_register"),
	global_modules = config.global_modules;


var call_expression = pp.actions.handlers.CallExpression;

pp.actions.handlers.TaggedTemplateLiteral = (_pp, token) => {
	switch (token.tag.name) {
		case "JT_PRE"     :
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

var parse_requires = module.exports = function (file, script) {
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

	file.requires.forEach(required_file => {
		if (! cache[required_file.path]) {
			parse_requires(required_file, cache, basedir, file);
		}
	});

	// Clear cache file
	file.requires = undefined;
};
