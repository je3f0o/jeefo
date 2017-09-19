/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : cli.js
* Created at  : 2017-09-01
* Updated at  : 2017-09-02
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

[
	"build",
	"generate",
	"new",
	"help"
].forEach(function (command) {
	cli.register(require(`./${ command }`));
});

module.exports = cli;
