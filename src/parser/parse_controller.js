/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_controller.js
* Created at  : 2017-08-15
* Updated at  : 2017-08-20
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var get_dependencies = function (params) {
	var i = params.length, dependencies = [];
	while (i--) {
		dependencies[i] = `"${ params[i].name }"`;
	}

	return dependencies.join(", ");
};

var parse_controller_function = function (_pp, token) {
	var pp     = _pp.$new(token),
		params = pp.parse(pp.code)[0].parameters;

	return pp.replace(token, `{ dependencies : [${ get_dependencies(params) }], protos : { on_init : ${ pp.code } } }`);
};

var parse_controller_protos = function (_pp, token) {
	var pp = _pp.$new(), i, properties, dependencies;

	pp.code = `z=${ pp.get_code(_pp.code, token) }`;

	properties = pp.parse(pp.code)[0].expression.right.properties;
	i = properties.length;
	
	while (i--) {
		if (properties[i].type !== "Property") {
			continue;
		}

		if (properties[i].key.name === "on_init") {
			dependencies = get_dependencies(properties[i].value.parameters);
			break;
		}
	}

	return pp.replace(token, `{ dependencies : [${ dependencies }], protos : ${ pp.code.substring(2) } }`);
};

module.exports = function (_pp, token) {
	if (token.type === "ObjectLiteral") {
		return parse_controller_protos(_pp, token);
	}
	return parse_controller_function(_pp, token);
};
