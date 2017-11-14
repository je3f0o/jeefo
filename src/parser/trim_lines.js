/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : trim_lines.js
* Created at  : 2017-08-20
* Updated at  : 2017-09-21
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var get_string = require("jeefo_preprocessor/src/actions/es5/get_string");

module.exports = function (_pp, token) {
	var pp     = _pp.$new(token),
		body   = pp.parse(pp.code)[0].expression.body,
		values = [], i = body.length, tl_pp;

	while (i--) {
		if (body[i].type === "TemplateLiteralExpression") {
			tl_pp = pp.$new(body[i].expression);

			values[i] = tl_pp.process_tokens(tl_pp.code, tl_pp.parse(tl_pp.code));
		} else {
			values[i] = get_string(body[i].value.split('\n').map(function (line) {
				return line.trim();
			}).join(''));
		}
	}

	return _pp.replace(token, values.join(" + "));
};
