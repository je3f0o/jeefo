/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_service.js
* Created at  : 2017-08-11
* Updated at  : 2017-08-20
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var pp                    = require("jeefo_preprocessor").es6.clone(),
	assignment_expression = pp.actions.handlers.AssignmentExpression;

pp.actions.register("AssignmentExpression", (_pp, token) => {
	if (token.left.type          === "MemberExpression" &&
		token.left.object.type   === "Identifier" && token.left.object.name   === "module" &&
		token.left.property.type === "Identifier" && token.left.property.name === "exports") {

		var Service = _pp.get_code(_pp.code, token.right);

		return pp.replace(token.right, `new ${ Service }()`);
	} else {
		return assignment_expression(_pp, token);
	}
});
module.exports = function (file) {
	pp.state     = file;
	file.content = pp.process(file.full_path, file.content);
};
