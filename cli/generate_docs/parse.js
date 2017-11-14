/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse.js
* Created at  : 2017-09-21
* Updated at  : 2017-09-22
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

module.exports = function (token) {
	switch (token.type) {
		case "FunctionExpression" :
			return {
				type   : "function",
				name   : token.id ? token.id.name : "Anonymous",
				values : token.parameters.map(function (param) {
					return param.name;
				}).join(',')
			};
	}

	return { type : token.type, };
};
