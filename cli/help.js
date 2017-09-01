/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : help.js
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

module.exports = {
	name        : "help",
	aliases     : ["-h", "--help"],
    description : "Shows help messages for this CLI",
    run : function () {
		var result = this.commands.map(command => command.help(this.name)).join("\n\n") + '\n';

		console.log(result);
	}
};
