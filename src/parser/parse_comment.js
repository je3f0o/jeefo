/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_comment.js
* Created at  : 2017-08-09
* Updated at  : 2017-09-21
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var pp = require("jeefo_preprocessor").es6.clone();

pp.actions.register("Comment", function (_pp, token) {
	switch (token.comment) {
		case "ignore:start" :
			_pp.state.ignore = {
				type  : "remove",
				start : token.start.index
			};
			break;
		case "ignore:end" :
			if (_pp.state.ignore) {
				_pp.state.ignore.end = token.end.index + 1;
				_pp.state.ignore_actions.push(_pp.state.ignore);

				_pp.state.ignore = null;
			}
			break;
	}
});

module.exports = function (content) {
	pp.state.ignore_actions = [];
	pp.process("REPLACE ME FILENAME", content);

	if (pp.state.ignore_actions.length) {
		var actions = pp.state.ignore_actions, i = actions.length;
		while (i--) {
			pp.action(actions[i]);
		}

		return pp.code;
	}

	return content;
};
