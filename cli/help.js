/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : help.js
* Created at  : 2017-09-01
* Updated at  : 2017-09-21
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

module.exports = {
	name        : "help",
	aliases     : ["-h", "--help"],
    description : "Shows help messages for this CLI",
    run : function () {
		var cli_name = this.name;

		var result = this.commands.map(function (command) {
			return command.help(cli_name);
		}).join("\n\n") + '\n';

		console.log(result);
	}
};
