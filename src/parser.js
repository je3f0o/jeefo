/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parser.js
* Created at  : 2016-11-26
* Updated at  : 2017-08-29
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* global */
/* exported */

/* old staff {{{1
var pp_module = jeefo.module("jeefo.ng.preprocessor", ["jeefo.preprocessor"]); // TODO: Use jeefo.require

// Registering Jeefo exporter actions
pp_module.namespace("preprocessor.jeefo.framework.exporter", [
	"jeefo.preprocessor",
	"javascript.ES6_parser",
	"transform.dash_case",
], function (__pp, parser) {
	var _pp    = __pp.copy();
	_pp.parser = parser;
	_pp.actions.handlers = {};

	var get_requires = function (token, requires) {
		var declarations = token.declarations,
			i = declarations.length, dependency;

		while (i--) {
			if (declarations[i].init                                  &&
				declarations[i].init.type        === "CallExpression" &&
				declarations[i].init.callee.type === "Identifier"     &&
				declarations[i].init.callee.name === "require") {

				dependency = declarations[i].init.arguments[0].value;
				if (requires.indexOf(dependency) === -1) {
					requires.unshift({
						name : dependency,
						_var : declarations[i].id.name,
					});
				}
			}
		}
	};

	var handle_requires = function (token, requires, pp) {
		var declarations = token.declarations,
			i = declarations.length, dependency, len = i;

		while (i--) {
			if (declarations[i].init                                  &&
				declarations[i].init.type        === "CallExpression" &&
				declarations[i].init.callee.type === "Identifier"     &&
				declarations[i].init.callee.name === "require") {

				dependency = declarations[i].init.arguments[0].value;
				if (requires.indexOf(dependency) === -1) {
					declarations.splice(i, 1);
				}
			}
		}

		if (declarations.length === 0) {
			return _pp.remove(token);
		} else if (declarations.length !== len) {
			console.log("IMPLEMENT ME", pp.state.__FILE_NAME__);
			process.exit();
		}
	};

	// Export others {{{2
	export_others = function (code) {
		var pp      = _pp.$new(),
			tokens  = pp.parse(code),
			actions = [],
			is_header_comment = true,
			init_code = '',
			header_comment = '',
			header_comment_index = -1, expr_counter = 0, i;

		pp.code = code;

		for (i = 0; i < tokens.length; ++i) {
			switch (tokens[i].type) {
				case "ExportDefaultDeclaration" :
					code = pp.get_code(code, tokens[i].declaration);

					actions.push(pp.remove(tokens[i]));
					is_header_comment = false;
					expr_counter += 1;
					break;
				case "Comment":
					if (is_header_comment) {
						header_comment_index = i;
					}
					break;
				default:
					expr_counter += 1;
					is_header_comment = false;
			}
		}

		if (header_comment_index > -1) {
			i = tokens[header_comment_index].end.index;
			header_comment = pp.code.substring(0, i);
			actions.unshift({
				type  : "remove",
				start : 0,
				end   : i
			});
		}

		i = actions.length;
		while (i--) {
			pp.action(actions[i]);
		}

		init_code = pp.code.trim();
		if (init_code) {
			init_code = `${ init_code }\n\n`;
		}

		code = `return ${ code }`.split('\n').map(line => `\t${ line }`).join('\n');
		code = `function () {\n${ code };\n}`;

		code = `${ init_code }__MY_MODULE__.${ pp.state.provider }("${ pp.state.__FILE_NAME__ }", ${ code });`;

		if (expr_counter > 1) {
			return `${ header_comment }\n(function () {\n${ code }\n}());`;
		}

		return `${ header_comment }\n${ code }`;
	};

	// Export directives {{{2
	export_directive = function (code) {
		var pp       = _pp.$new(),
			tokens   = pp.parse(code),
			actions  = [],
			requires = [],
			is_header_comment = true, i = tokens.length,
			dependencies = '', args = '',
			header_comment = '', init_code = '',
			header_comment_index = -1, is_inside_ignore;

		pp.code = code;

		while (i--) {
			if (tokens[i].type === "VariableDeclaration") {
				get_requires(tokens[i], requires);
			}
		}

		if (requires.length) {
			dependencies = '[' + requires.map(dependency => `"${ dependency.name }"`).join(", ") + "], ";
			args         = requires.map(dependency => dependency._var).join(", ");
		}

		for (i = 0; i < tokens.length; ++i) {
			switch (tokens[i].type) {
				case "VariableDeclaration" :
					if (is_inside_ignore) { break; }

					actions.push(handle_requires(tokens[i], requires, pp));
					is_header_comment = false;
					break;
				case "ExportDefaultDeclaration" :
					if (is_inside_ignore) { break; }

					code = pp.get_code(code, tokens[i].declaration);

					actions.push(pp.remove(tokens[i]));
					is_header_comment = false;
					break;
				case "Comment":
					if (is_header_comment) {
						if (is_inside_ignore) {
							if (tokens[i].comment === "ignore:end") {
								is_inside_ignore = false;
							}
						} else if (tokens[i].comment === "ignore:start") {
							is_inside_ignore = true;
						}

						header_comment_index = i;
					}
					break;
			}
		}

		if (header_comment_index > -1) {
			i = tokens[header_comment_index].end.index;
			header_comment = pp.code.substring(0, i);
			actions.unshift({
				type  : "remove",
				start : 0,
				end   : i
			});
		}

		i = actions.length;
		while (i--) {
			pp.action(actions[i]);
		}

		init_code = pp.code.split('\n').map(line => `\t${ line }`).join("\n").trim();
		code = `return ${ code }`.split('\n').map(line => `\t${ line }`).join('\n');

		if (init_code) {
			init_code = `\t${ init_code }\n\n`;
		}

		code = `${ dependencies }function (${ args }) {\n${ init_code }${ code };\n}`;

		return `${ header_comment }\n__MY_MODULE__.${ pp.state.provider }("${ pp.state.__FILE_NAME__ }", ${ code });`;
	};
	// }}}2
}).

// Registering Jeefo actions
namespace("preprocessor.ng", [
	"jeefo.preprocessor",
	"javascript.ES6_parser",
	"transform.dash_case",
], function (pp, parser, dash_case) {
	ng        = pp.copy();
	ng.parser = parser;

    // Jeefo Dependency Injection {{{2
	ng.actions.register("JeefoDependencyInjection", function (_pp, token) {
		if (! token.parameters) { return; }

		var pp = _pp.$new(), params = token.parameters, fn, code, action;

		pp.code = _pp.get_code(_pp.code, token);
		fn      = pp.parse(pp.code)[0];

		fn.type = "FunctionExpression";
		if (pp.has_action(fn.type)) {
			action = pp.actions.invoke(pp, fn);
			pp.action(action);
		}

		if (params.length) {
            params = params.map(p => `"${ p.name }"`).join(", ");
			code = `[${ params }], ${ pp.code }`;

			return pp.replace(token, code);
		} else if (action) {
			return pp.replace(token, pp.code);
		}
	}).

	// Jeefo Function annotation {{{2
	register("JeefoFunctionAnnotation", function (_pp, token) {
		if (! token.parameters) { return; }

		var i = 0, pp = _pp.$new(), params = token.parameters, fn, code, action;

		pp.code = _pp.get_code(_pp.code, token);
		fn      = pp.parse(pp.code)[0];

		fn.type = "FunctionExpression";
		if (pp.has_action(fn.type)) {
			action = pp.actions.invoke(pp, fn);
			pp.action(action);
		}

		if (params.length) {
			code = '[';
			for (; i < params.length; ++i) {
				code += `"${ params[i].name }", `;
			}
			code += `${ pp.code }]`;

			return pp.replace(token, code);
		} else if (action) {
			return pp.replace(token, pp.code);
		}
	}).

	// Jeefo Transcluder {{{2
	register("JeefoTranscluder", function (_pp, token) {
		var i = 0, pp = _pp.$new(), params = token.parameters, fn, dependencies, action;

		pp.code = _pp.get_code(_pp.code, token);
		fn      = pp.parse(pp.code)[0];

		if (! params.length) {
			return pp.replace(token, `{ dependencies : [], fn : ${ pp.code } }`);
		}

		fn.type = "FunctionExpression";
		if (pp.has_action(fn.type)) {
			action = pp.actions.invoke(pp, fn);
			pp.action(action);
		}

		if (params.length) {
			i            = params.length;
			dependencies = `"${ dash_case(params[--i].name) }"`;

			while (i--) {
				dependencies = `"${ dash_case(params[i].name) }", ${ dependencies }`;
			}

			return pp.replace(token, `{ dependencies : [${ dependencies }], fn : ${ pp.code } }`);
		} else if (action) {
			return pp.replace(token, pp.code);
		}
	}).

	// Jeefo Linker {{{2
	register("JeefoLinker", function (_pp, token) {
		var i = 0, pp = _pp.$new(), params = token.parameters, dependencies = '', fn, action, name;

		pp.code = _pp.get_code(_pp.code, token);
		fn      = pp.parse(pp.code)[0];

		if (! params.length) {
			return pp.replace(token, `{ dependencies : [], fn : ${ pp.code } }`);
		}

		fn.type = "FunctionExpression";
		if (pp.has_action(fn.type)) {
			action = pp.actions.invoke(pp, fn);
			pp.action(action);
		}

		if (params.length) {
			i = params.length;

			while (i--) {
				name = params[i].name;

				if (dependencies) {
					dependencies = `, ${ dependencies }`;
				}

				if (name === "$element") {
					dependencies = `"$element"${ dependencies }`;
				} else if (name.startsWith("__")) {
					dependencies = `{ name : "${ dash_case(name.substring(2)) }", direction : '^^' }${ dependencies }`;
				} else if (name.startsWith("_")) {
					dependencies = `{ name : "${ dash_case(name.substring(1)) }", direction : '^' }${ dependencies }`;
				} else {
					dependencies = `{ name : "${ dash_case(name) }" }${ dependencies }`;
				}
			}

			return pp.replace(token, `{ dependencies : [${ dependencies }], fn : ${ pp.code } }`);
		} else if (action) {
			return pp.replace(token, pp.code);
		}
	}).

	// Ng Controller provider {{{2
	register("NgControllerProvider", function (pp, token) {
		token.type = "JeefoDependencyInjection";
		var action = pp.actions.invoke(pp, token);
		if (action) {
			return action.value;
		}

		return pp.get_code(pp.code, token);
	}).

	// Jeefo Directive's Controller {{{2
	register("JeefoDirectiveController", function (pp, token) {
		if (token.properties) {
			token.type = "JeefoDirectiveControllersPrototype";
			return pp.actions.invoke(pp, token);
		} else if (token.parameters) {
			token.type = "JeefoFunctionAnnotation";
			return pp.actions.invoke(pp, token);
		}
	}).

	// Jeefo Controller's prototype {{{2
	register("JeefoDirectiveControllersPrototype", function (_pp, token) {
		var pp = _pp.$new(),
			i = 0, actions = [], has_action, properties;

		pp.code    = _pp.get_code(_pp.code, token);
		properties = pp.parse(pp.code)[0].properties;

		for (; i < properties.length; ++i) {
			if (properties[i].type === "Property") {
				switch (properties[i].key.name) {
					case "on_init" :
						properties[i].value.type = "JeefoFunctionAnnotation";
						actions[i] = pp.actions.invoke(pp, properties[i].value);
						break;
					default:
						if (pp.actions.has(properties[i].value.type)) {
							actions[i] = pp.actions.invoke(pp, properties[i].value);
						}
				}
			}
		}

		i = actions.length;
		while (i--) {
			if (has_action) {
				pp.action(actions[i]);
			} else {
				has_action = pp.action(actions[i]);
			}
		}

		if (has_action) {
			return _pp.replace(token, pp.code);
		}
	}).

	// Jeefo Directive provider {{{2
	register("JeefoDirectiveProvider", function (_pp, token) {
		var pp         = _pp.$new(),
			code       = _pp.get_code(_pp.code, token),
			properties = pp.parse(code)[0].properties,
			i = 0, j = 0, actions = [];

		pp.code = code;

		for (i = 0; i < properties.length; ++i) {
			if (properties[i].type === "Property") {
				switch (properties[i].key.name) {
					case "link"        :
						properties[i].value.type = "JeefoLinker";
						break;
					case "transcluder" :
						properties[i].value.type = "JeefoTranscluder";
						break;
					case "controller"  :
						properties[i].value.type = "JeefoDirectiveController";
						break;
				}

				if (pp.has_action(properties[i].value.type)) {
					actions[j++] = pp.actions.invoke(pp, properties[i].value);
				}
			}
		}

		for (i = actions.length - 1; i >= 0; --i) {
			pp.action(actions[i]);
		}

		token      = pp.parse(pp.code)[0];
		token.type = "JeefoDependencyInjection";
		actions[0] = pp.actions.invoke(pp, token);
		pp.action(actions[0]);

		return pp.code;
	}).

	// Ng State Views {{{2
	register("NgStateViews", function (_pp, token) {
		var pp = _pp.$new(), actions = [], i = 0, j = 0, code, has_action, properties;

		pp.code    = _pp.get_code(_pp.code, token);
		properties = pp.parse(pp.code)[0].properties;

		for (; i < properties.length; ++i) {
			if (properties[i].type === "Property") {
				properties[i].value.type = "NgStateObject";
				code = pp.actions.invoke(pp, properties[i].value);
				if (code) {
					actions[j++] = pp.replace(properties[i].value, code);
				}
			}
		}

		for (i = actions.length - 1; i >= 0; --i) {
			if (has_action) {
				pp.action(actions[i]);
			} else {
				has_action = pp.action(actions[i]);
			}
		}

		if (has_action) {
			return _pp.replace(token, pp.code);
		}
	}).

	// Jeefo State Object {{{2
	register("NgStateObject", function (_pp, token) {
		var pp = _pp.$new(), actions = [], i = 0, j = 0, properties, has_action;

		pp.code    = _pp.get_code(_pp.code, token);
		properties = pp.parse(pp.code)[0].properties;

		for (; i < properties.length; ++i) {
			if (properties[i].type !== "Property") { continue; }

			switch (properties[i].key.name) {
				case "views" :
					properties[i].value.type = "NgStateViews";
					actions[j++] = pp.actions.invoke(pp, properties[i].value);
					break;
				case "resolve" :
					for (var k = 0, resolvers = properties[i].value.properties; k < resolvers.length; ++k) {
						if (resolvers[k].type === "Property" && resolvers[k].value.type === "FunctionExpression") {
							resolvers[k].value.type = "JeefoFunctionAnnotation";
							actions[j++] = pp.actions.invoke(pp, resolvers[k].value);
						}
					}
					break;
				case "controller" :
					properties[i].value.type = "JeefoDirectiveController";
					actions[j++] = pp.actions.invoke(pp, properties[i].value);
					break;
				case "templateProvider" :
					properties[i].value.type = "JeefoFunctionAnnotation";
					actions[j++] = pp.actions.invoke(pp, properties[i].value);
					break;
				default:
					if (pp.has_action(properties[i].value.type)) {
						actions[j++] = pp.actions.invoke(pp, properties[i].value);
					}
			}
		}

		for (i = actions.length - 1; i >= 0; --i) {
			if (! has_action) {
				has_action = pp.action(actions[i]);
			} else {
				pp.action(actions[i]);
			}
		}

		return pp.code;
	}).

	// Ng Config CallExpression {{{2
	register("NgConfigCallExpression", function (pp, token) {
		LOOP:
		for (let callee = token.callee; ; callee = callee.callee) {
			switch (callee.type) {
				case "MemberExpression" :
					if (callee.object.name === "$stateProvider" && callee.property.name === "state") {
						var states = pp.state.states.join("\n\t\t");
						if (! states) {
							return "remove";
						}
						return pp.replace(token, `$stateProvider\n\t\t${ states }`);
					}
					break LOOP;
				case "CallExpression" :
					break;
				default:
					break LOOP;
			}
		}
	}).

	// Ng Config {{{2
	register("NgConfig", function (_pp, token) {
		var code       = _pp.get_code(_pp.code, token),
			pp         = _pp.$new(),
			statements = pp.parse(code)[0].body.body,
			i = statements.length - 1;

		pp.code = code;

		for (; i >= 0; --i) {
			if (statements[i].type === "ExpressionStatement" && statements[i].expression.type === "CallExpression") {
				statements[i].expression.type = "NgConfigCallExpression";
				var action = pp.actions.invoke(pp, statements[i].expression);
				if (action) {
					if (action === "remove") {
						action = pp.remove(statements[i]);
					}

					pp.action(action);
					return _pp.replace(token, pp.code);
				}
			}
		}
	}).

	// Jeefo Export {{{2
	register("ExportDefaultDeclaration", function (pp, token) {
		var code;

		switch (pp.state.provider) {
			case "config" :
				var _pp = pp.$new();
				_pp.code = pp.code;

				token.declaration.type = "NgConfig";
				var action = _pp.actions.invoke(_pp, token.declaration);
				_pp.action(action);

				_pp = _pp.$new();
				_pp.code = action.value;

				var body  = _pp.parse(_pp.code)[0];
				body.type = "JeefoFunctionAnnotation";
				action = _pp.actions.invoke(_pp, body);
				if (action) {
					_pp.action(action);
				}

				code = _pp.code;
				//code = `__MY_MODULE__.config(${ _pp.code });`;
				break;
			case "directive" :
			case "component" :
				token.declaration.type = "JeefoDirectiveProvider";
				code = `${ pp.actions.invoke(pp, token.declaration) };`;
				//code = `__MY_MODULE__.${ pp.state.provider }("${ pp.state.__FILE_NAME__ }", ${ pp.actions.invoke(pp, token.declaration) });`;
				break;
			case "factory" :
			case "service" :
				code = pp.get_code(pp.code, token.declaration);
				break;
			case "filter"     :
			case "controller" :
				token.declaration.type = "NgControllerProvider";
				code = pp.actions.invoke(pp, token.declaration);
				//code = `__MY_MODULE__.${ pp.state.provider }("${ pp.state.__FILE_NAME__ }", ${ pp.actions.invoke(pp, token.declaration) });`;
				break;
			case "state" :
				token.declaration.type = "NgStateObject";
				code = `${ pp.state.states_variable }.push(${ pp.actions.invoke(pp, token.declaration) });`;
				break;
			default:
				console.log("Unknown provider", pp.state.provider);
				process.exit();
		}

		return pp.replace(token, `export default ${ code }`);
	});
	// }}}2

	return ng;
});
}}} 1*/

// ignore:end

var config = require("./config");

module.exports = function parse_source_file () {
	var parse_requires = require("./parser/parse_requires");

	config.files.forEach(file => parse_requires(file));
};
