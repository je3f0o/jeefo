/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-08-29
* Updated at  : 2017-08-29
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var parse      = require("./src/parser"),
	config     = require("./src/config"),
	compile    = require("./src/compiler"),
	initialize = require("./src/initialize");

module.exports = function jeefo (options) {
	config.basedir    = process.cwd();
	config.global_dir = __dirname;

	initialize(config, options);

	parse();
	compile(options.build);
};
