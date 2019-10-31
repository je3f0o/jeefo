/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : print_command.js
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

const style                = require("jeefo_command/src/misc/style"),
	  exit                 = require("jeefo_command/helpers/exit"),
	  exit_required_option = require("jeefo_command/helpers/exit_required_option");

module.exports = {
	name        : "print",
	description : "Print bash auto-completion informations for this command line tool.",
	options     : [
		{ name : "command-name"       , type : "string" } ,
		{ name : "option-name"        , type : "string" } ,
		{ name : "type"               , type : "bool"   } ,
		{ name : "available-commands" , type : "bool"   } ,
		{ name : "available-options"  , type : "bool"   } ,
	],
	execute     : function (options, command_manager) {
		// {{{1 print available commands
		if (options["available-commands"]) {
			console.log(command_manager.map(command => command.name).join(' '));
			exit();
		}

		// {{{1 get command
		const command_name = options["command-name"];
		if (! command_name) {
			exit_required_option("--command-name");
		} else if (! command_manager.has_command(command_name)) {
			exit([
				style("Command ", "red"),
				style(`'${ command_name }'`, "cyan"),
				style(" is not a valid command name.", "red")
			].join(''));
		}

		const command = command_manager.get_command(command_name);

		// {{{1 print available options
		if (options["available-options"]) {
			console.log(command.map(option => option.name).join(' '));
			exit();
		}

		// {{{1 option type
		if (options.type) {
			const option_name          = options["option-name"],
				  prefixed_option_name = `--${ option_name }`;

			if (! option_name) {
				exit_required_option("--option-name");
			}

			command.each(option => {
				if (option.name === prefixed_option_name) {
					console.log(option.type);
					exit();
				}
			});

			exit([
				style("Option ", "red"),
				style(`'${ option_name }'`, "cyan"),
				style(" is not a valid option name for ", "red"),
				style(`'${ command.name }'`, "cyan"),
				style(' command.', "red")
			].join(''));
		}
		// }}}1
	}
};
