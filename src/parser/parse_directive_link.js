/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_directive_link.js
* Created at  : 2017-08-11
* Updated at  : 2017-08-11
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var CAMEL_CASE_REGEXP = /[A-Z]/g;
var dash_case = function (str) {
	return str.replace(CAMEL_CASE_REGEXP, function (letter, pos) {
		return (pos ? '-' : '') + letter.toLowerCase();
	});
};

module.exports = function (_pp, token) {
	var params = token.parameters,
		i = params.length, code = _pp.get_code(_pp.code, token),
		dependencies = '', name;

	if (! params.length) {
		return _pp.replace(token, `{ dependencies : [], fn : ${ code } }`);
	}

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

	return _pp.replace(token, `{ dependencies : [${ dependencies }], fn : ${ code } }`);
};
