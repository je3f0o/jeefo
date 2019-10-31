/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : help_command.js
* Created at  : 2019-01-13
* Updated at  : 2019-10-31
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const exit  = require("@jeefo/command/helpers/exit"),
	  style = require("@jeefo/command/misc/style");

module.exports = {
	name        : "help",
	aliases     : ['h', "-h", "--help", '?'],
    description : "Print commands and options description and exit",
    options     : [
        { name: "option" , type: "String", aliases: ['o'] } ,
        { name: "command", type: "String", aliases: ['c'] } ,
    ],
    execute : function (options, command_manager) {
		var command, result;

		if (options.command) {
			if (command_manager.has_command(options.command)) {
				command = command_manager.get_command(options.command);
			} else if (command_manager.has_alias(options.command)) {
				command = command_manager.get_command_by_alias_name(options.command);
			} else {
				exit([
					style("The specified ", "red"),
					style(options.command, "cyan"),
					style(` command is not registered. For available options, see \`${ command_manager.application_name } help\`.`, "red"),
				].join(''));
			}

			result = command.help(command_manager.application_name);
		} else {
			result = command_manager.map(command => command.help(command_manager.application_name)).join("\n\n") + "\n";
		}

		console.log(result);
		exit();
	}
};
