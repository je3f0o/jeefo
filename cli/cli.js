/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : cli.js
* Created at  : 2017-09-01
* Updated at  : 2017-09-01
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var CLI = require("jeefo_command"),
	cli = new CLI("jeefo");

cli.register(require("./build"));
cli.register(require("./generate"));
cli.register(require("./help"));

module.exports = cli;
