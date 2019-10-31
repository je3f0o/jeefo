/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2019-01-10
* Updated at  : 2019-01-18
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

const fse                = require("fs-extra"),
	  path               = require("path"),
	  style              = require("jeefo_command/src/misc/style"),
	  waterfall          = require("async-waterfall"),
	  { exec, execFile } = require('child_process');

const JEEFO_COMMANDS_DIR = ".bash/jeefo_command";

const EXECUTABLES_PATH     = `${ JEEFO_COMMANDS_DIR }/executables.sh`;
const JEEFO_COMMANDS_PATH  = `${ JEEFO_COMMANDS_DIR }/jeefo_commands.sh`;
const AUTO_COMPLETION_PATH = `${ JEEFO_COMMANDS_DIR }/auto-completion.sh`;

module.exports = {
	name        : "install",
	description : "Install bash auto-completion for this command line tool.",
	options     : [
		{ name : "force", type : "bool" }
	],
	execute     : function (options, command_manager, application_name) {
		waterfall([
			// {{{1 .bash_profile and auto-completion.sh
			cb => {
				// copy auto-completion.sh 
				const AUTO_COMPLETION_FULL_PATH = path.join(process.env.HOME, AUTO_COMPLETION_PATH);
				if (! fse.existsSync(AUTO_COMPLETION_FULL_PATH) || options.force) {
					fse.copySync(path.join(__dirname, "auto-completion.sh"), AUTO_COMPLETION_FULL_PATH, {
						overwrite : true
					});
				}

				// append bashrc
				var bashrc_path = path.join(process.env.HOME, ".bash_profile");
				if (! fse.existsSync(bashrc_path)) {
					bashrc_path = path.join(process.env.HOME, ".bashrc");
				}

				execFile("grep", [`source ~/${ JEEFO_COMMANDS_PATH }$`, bashrc_path], err => {
					if (err) {
						fse.appendFile(bashrc_path, [
							"\n# jeefo_command auto-completion",
							`source ~/${ JEEFO_COMMANDS_PATH }`
						].join('\n'), cb);
					} else {
						cb();
					}
				});
			},
			
			// {{{1 jeefo_command.sh
			cb => {
				const JEEFO_COMMANDS_FULL_PATH = path.join(process.env.HOME, JEEFO_COMMANDS_PATH);
				if (! fse.existsSync(JEEFO_COMMANDS_FULL_PATH) || options.force) {
					fse.outputFile(JEEFO_COMMANDS_FULL_PATH, [
						"# jeefo_command auto-completion",
						"# -----------------------------",
						"# This file will be automatically generated when user execute `jeefo_command install --force`",
						"# So please do not modify this file.",
						"# You will be lost everything inside this file!\n",
						`source ~/${ AUTO_COMPLETION_PATH }`,
						`source ~/${ EXECUTABLES_PATH }`
					].join('\n'), cb);
				} else {
					cb();
				}
			},

			// {{{1 executables.sh
			cb => {
				const complete_command      = `complete -o nospace -F _jeefo_command_auto_completion ${ application_name }`;
				const EXECUTABLES_FULL_PATH = path.join(process.env.HOME, EXECUTABLES_PATH);

				execFile("grep", [`${ complete_command }$`, EXECUTABLES_FULL_PATH], err => {
					var is_installed = false;
					if (err) {
						fse.appendFileSync(EXECUTABLES_FULL_PATH, `\n# jeefo_command: ${ application_name }\n${ complete_command }\n`);
						is_installed = true;
					}
					cb(null, is_installed);
				});
			}
			// }}}1
		], (err, is_installed) => {
			if (is_installed || options.force) {
				exec(`source ~/${ JEEFO_COMMANDS_PATH }`, err => {
					if (err) {
						console.error("Something bad happened.");
						console.error(err);
						process.exit(1);
					}

					console.log([
						style(application_name, "cyan"),
						style(" bash auto-completion is successfully installed.", "green")
					].join(''));

					process.exit(0);
				});
			} else {
				console.log([
					style(application_name, "cyan"),
					style(" bash auto-completion is already installed.", "yellow")
				].join(''));
				process.exit(1);
			}
		});
	}
};
