/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_register.js
* Created at  : 2017-08-10
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var parse_state     = require("./parse_state"),
	parse_service   = require("./parse_service"),
	parse_directive = require("./parse_directive");

var register = function (path, file) {
return `jeefo.register("${ path }", function (require, exports, module) {
${ file.content.trim() }
});${ file.linker }`;

};

module.exports = function (path, file) {
	if (path.endsWith("_state.js")) {
		parse_state(file);

		file.linker = `\n\njeefo.state("${ file.state_name }", "${ path }");`;
	} else if (path.endsWith("_directive.js")) {
		parse_directive(file);

		file.linker = `\n\njeefo.directive(${ file.selectors }, "${ path }");`;
	} else if (path.endsWith("_component.js")) {
		parse_directive(file);

		file.linker = `\n\njeefo.component(${ file.selectors }, "${ path }");`;
	} else {
		if (path.endsWith("_service.js")) {
			parse_service(file);
		}
		file.linker = '';
	}

	return register(path, file);
};
