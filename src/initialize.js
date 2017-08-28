/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : initialize.js
* Created at  : 2017-08-29
* Updated at  : 2017-08-29
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var fse        = require("fs-extra"),
	path       = require("path"),
	//util     = require("util"),
	colors     = require("./colors"),
	load_cores = require("./load_cores");

var join = function () {
	var file_path = path.join.apply(path, arguments);

	if (! file_path.endsWith(".js")) {
		file_path += ".js";
	}

	return file_path;
};

var pre_includes = function (config) {
	if (config.jeefo.pre_includes) {
		config.jeefo.pre_includes.forEach(filepath => {
			config.pre_includes.push(fse.readFileSync(filepath, "utf8"));
		});
	}
};

module.exports = function initialize (config/*, options */) {
	config.jeefo_path = path.join(config.basedir, "jeefo.json");

	if (! fse.existsSync(config.jeefo_path)) {
		console.error(colors.red("'jeefo.json' file is not found."));
		console.error(`jeefo_path : ${ config.jeefo_path }`);
		process.exit();
	}
	var jeefo = config.jeefo = require(config.jeefo_path);

	// Debug path
	config.debug_path = path.join(config.basedir, jeefo.dist, `${ jeefo.name }.debug.js`);

	config.global_modules = ["states", "directives", "components"];

	config.files_cache_path  = path.join(config.basedir, ".cache/files.json");
	config.config_cache_path = path.join(config.basedir, ".cache/config.json");

	// app name
	if (jeefo.main) {
		load_cores(config);
		config.files.push(`./${ jeefo.main }`);
	} else {
		config.files = config.files.concat(jeefo.files);
	}

	pre_includes(config);

	var path_resolve = require("./parser/path_resolver");
	config.files = config.files.map(file_path => path_resolve('.', file_path));

	/*
	this.user_options = parsed_options.options;

	this.module_dir = this.user_options["input-directory"] ? path.resolve(this.user_options["input-directory"]) : process.cwd();
	
	if (! fse.existsSync(this.module_dir)) {
		console.error(`module_dir : ${ this.module_dir }`);
		this.error("Module directory is not found.");
	}

	this.init_config();
	*/
};
