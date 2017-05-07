/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : header_compiler.js
* Created at  : 2017-05-03
* Updated at  : 2017-05-03
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

module.exports = function (header) {

var MAX_LENGTH = Object.keys(header).reduce((l, k) => Math.max(k.length, l), 0);

var align = function (str, value) {
	var i = 0, space = '', len = MAX_LENGTH - str.length;

	for (; i < len; ++i) {
		space += ' ';
	}

	return `${ str }${ space } : ${ value }`;
};

return `/**
 * ${ Object.keys(header).map(key => align(key, header[key])).join("\n * ") }
 **/
`;

};
