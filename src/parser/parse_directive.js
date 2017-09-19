/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_directive.js
* Created at  : 2017-08-10
* Updated at  : 2017-09-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var pp                    = require("jeefo_preprocessor").es6.clone(),
	parse_controller      = require("./parse_controller"),
	parse_directive_link  = require("./parse_directive_link"),
	assignment_expression = pp.actions.handlers.AssignmentExpression;

var get_selector = function (token) {
	if (token.type === "StringLiteral") {
		return `["${ token.value }"]`;
	}
};

var parse_directive = function (_pp, token) {
	var pp = _pp.$new(), actions = [], i, properties;

	pp.code = `z=${ pp.get_code(_pp.code, token) }`;

	properties = pp.parse(pp.code)[0].expression.right.properties;
	i = properties.length;
	
	while (i--) {
		if (properties[i].type !== "Property") {
			continue;
		}

		switch (properties[i].key.name) {
			case "selector" :
				var selector      = get_selector(properties[i].value),
					remove_action = {
						type  : "remove",
						start : properties[i].start.index,
						end   : properties[i].end.index,
					};

				_pp.state.selectors = selector;

				if (properties.length - 1 > i) {
					remove_action.end = properties[i + 1].start.index;

					actions[i] = remove_action;
				} else if (properties.length === 1) {
					return "{}";
				}
				break;
			case "controller" :
				actions[i] = parse_controller(pp, properties[i].value);
				break;
			case "link" :
				actions[i] = parse_directive_link(pp, properties[i].value);
				break;
		}
	}

	i = actions.length;
	while (i--) {
		pp.action(actions[i]);
	}

	return pp.code.substring(2);
};

pp.actions.register("AssignmentExpression", (_pp, token) => {
	if (token.left.type          === "MemberExpression" &&
		token.left.object.type   === "Identifier" && token.left.object.name   === "module" &&
		token.left.property.type === "Identifier" && token.left.property.name === "exports") {

		var code = parse_directive(_pp, token.right);

		return pp.replace(token.right, code);
	} else {
		return assignment_expression(_pp, token);
	}
});

module.exports = function (file) {
	pp.state = file;
	file.content = pp.process(file.full_path, file.content);
};
