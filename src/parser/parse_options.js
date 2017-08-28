/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parse_options.js
* Created at  : 2017-08-15
* Updated at  : 2017-08-15
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

let fse  = require("fs-extra"),
	path = require("path");

module.exports = function (config) {
	console.log(config);
	process.exit()
	this.user_options = parsed_options.options;

	this.module_dir = this.user_options["input-directory"] ? path.resolve(this.user_options["input-directory"]) : process.cwd();
	
	if (! fse.existsSync(this.module_dir)) {
		console.error(`module_dir : ${ this.module_dir }`);
		this.error("Module directory is not found.");
	}

	if (fse.lstatSync(this.module_dir).isDirectory()) {
		this.jeefo_json_path = path.join(this.module_dir, "jeefo.json");

		if (! fse.existsSync(this.jeefo_json_path)) {
			console.error(`jeefo_path : ${ this.jeefo_json_path }`);
			this.error("'jeefo.json' file is not found.");
		}
	}

	this.init_config();
};
