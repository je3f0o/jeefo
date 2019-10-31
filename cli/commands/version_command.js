/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : version_command.js
* Created at  : 2019-01-13
* Updated at  : 2019-01-13
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var pkg  = require("../../package"),
	exit = require("jeefo_command/helpers/exit");

module.exports = {
	name        : "version",
	aliases     : ['v'],
    description : "Print current version and exit.",
    execute : function () {
		console.log(pkg.version);
		exit();
	}
};
