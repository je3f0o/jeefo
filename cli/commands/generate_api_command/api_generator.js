/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : api_generator.js
* Created at  : 2019-01-22
* Updated at  : 2019-01-22
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

const fse       = require("fs-extra"),
	  path      = require("path"),
	  parser    = require("jeefo_javascript_parser/src/es6_parser"),
	  HashTable = require("jeefo_command/src/hash_table");

/*
const original_call_expression = pp.actions.handlers.CallExpression;

pp.actions.handlers.CallExpression = (_pp, token) => {
	var state    = _pp.state,
		requires = state.requires;
	
	console.log(token);

	if (token.callee.type === "Identifier" && token.callee.name === "require") {
		return original_call_expression(_pp, token);
		/*
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
		return original_call_expression(_pp, token);
	}
};
		*/

module.exports = class API_Generator {
	constructor (base_dir) {
		this.API                = [];
		this.base_dir           = base_dir;
		this.scripts_hash_table = new HashTable();
	}

	load_script (file_path) {
		const absolute_file_path = path.join(this.base_dir, file_path);
		if (this.scripts_hash_table.has(absolute_file_path)) {
			return;
		}

		let file = {
			content : fse.readFileSync(absolute_file_path, "utf8")
		};
		parser.parse(file.content);
		//console.log(111, parser.parse(file.content));

		return file;
	}
};
