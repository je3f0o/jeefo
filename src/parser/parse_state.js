/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_state.js
* Created at  : 2017-08-15
* Updated at  : 2017-08-30
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var pp                    = require("jeefo_preprocessor").es6.clone(),
	parse_resolver        = require("./parse_resolver"),
	parse_controller      = require("./parse_controller"),
	assignment_expression = pp.actions.handlers.AssignmentExpression;

var parse_state_name = function (_pp, token) {
	var pp = _pp.$new(), actions = [], i, properties;

	pp.code = `z=${ pp.get_code(_pp.code, token) }`;

	properties = pp.parse(pp.code)[0].expression.right.properties;
	i = properties.length;
	
	while (i--) {
		if (properties[i].type !== "Property") {
			continue;
		}

		switch (properties[i].key.name) {
			case "name" :
				_pp.state.state_name = properties[i].value.value;
				break;
			case "controller" :
				actions[i] = parse_controller(pp, properties[i].value);
				break;
			case "resolve" :
				actions[i] = parse_resolver(pp, properties[i].value);
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

		var code = parse_state_name(_pp, token.right);

		return pp.replace(token.right, code);
	} else {
		return assignment_expression(_pp, token);
	}
});

module.exports = function (file) {
	pp.state = file;
	file.content = pp.process(file.full_path, file.content);
};