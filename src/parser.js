/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parser.js
* Created at  : 2016-11-26
* Updated at  : 2017-08-31
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* global */
/* exported */

// ignore:end

var config = require("./config");

module.exports = function parse_source_file () {
	var parse_requires = require("./parser/parse_requires");

	config.files.forEach(parse_requires);
};
