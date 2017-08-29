/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_resolver.js
* Created at  : 2017-08-30
* Updated at  : 2017-08-30
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var surround_quote = function (token) {
	return `"${ token.name }"`;
};

module.exports = function parse_resolver (_pp, token) {
	var pp = _pp.$new(), actions = [], i, params, properties, dependencies;

	pp.code = `z=${ pp.get_code(_pp.code, token) }`;

	properties = pp.parse(pp.code)[0].expression.right.properties;
	i = properties.length;

	while (i--) {
		if (properties[i].type !== "Property") {
			continue;
		}

		params = properties[i].value.parameters;
		if (params.length) {
			dependencies = params.map(surround_quote).join(", ");
			actions[i] = pp.replace(properties[i].value, `{ dependencies : [${ dependencies }], fn : ${ pp.get_code(pp.code, properties[i].value) } }`);
		}
	}

	i = actions.length;
	while (i--) {
		pp.action(actions[i]);
	}

	return _pp.replace(token, pp.code.substring(2));
};
