/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : cli.js
* Created at  : 2017-09-01
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

var JeefoCommandManager = require("@jeefo/command"),
	command_manager     = new JeefoCommandManager(require("../package").name);

//command_manager.register(require("./build"));
//command_manager.register(require("./generate"));
//command_manager.register(require("./new"));

//command_manager.register(require("./commands/generate_api_command"));

command_manager.register(require("./commands/install_command"));
command_manager.register(require("./commands/version_command"));
command_manager.register(require("./commands/print_command"));
command_manager.register(require("./commands/help_command"));

module.exports = command_manager;
