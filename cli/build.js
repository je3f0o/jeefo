/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : build.js
* Created at  : 2017-09-01
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

var fse           = require("fs-extra"),
	path          = require("path"),
	//util        = require("util"),
	//colors      = require("./colors"),
	parse         = require("../src/parser"),
	config        = require("../src/config"),
	output        = require("./build/output"),
	load_cores    = require("./build/load_cores"),
	path_resolve  = require("../src/parser/path_resolver"),
	parse_comment = require("../src/parser/parse_comment");

var set_basedir = function (basedir) {
	config.basedir = (basedir === "'.'") ? process.cwd() : path.resolve(basedir);
	path_resolve.set_basedir(config.basedir);
};

var set_config_file = function (file_path, options) {
	var _config = require(path.join(process.cwd(), file_path));

	if (_config["input-directory"]) {
		options["input-directory"] = path.resolve(_config["input-directory"]);
	}

	if (_config.name) {
		options.name = _config.name;
	}

	if (_config.cache) {
		options.cache = true;

		if (_config["cache-directive"]) {
			options["cache-directive"] = _config["cache-directive"];
		}
	}

	if (_config.output === false) {
		options.output = false;
	} else if (_config["output-directory"]) {
		options["output-directory"] = _config["output-directory"];
	}

	if (_config.pre_includes) {
		options.pre_includes = _config.pre_includes;
	}

	if (_config.post_includes) {
		options.post_includes = _config.post_includes;
	}

	if (_config.type === void 0) {
		_config.type = "app";
	}

	switch (_config.type) {
		case "app" :
			options.type = "app";

			if (_config.main) {
				options.main = _config.main;
			}

			if (_config["load-core-cache"] === void 0) {
				options["load-core-cache"] = true;
			} else {
				options["load-core-cache"] = _config["load-core-cache"] === "true";
			}
			break;
		case "dll" :
			options.type = "dll";
			if (_config.files) {
				options.files = _config.files;
			}
			break;
	}
};

var pre_includes = function (pre_includes) {
	pre_includes.forEach(function (filepath) {
		var content = fse.readFileSync(filepath, "utf8");
		content = parse_comment(content).trim();
		config.pre_includes.push(content);
	});
};

module.exports = {
	name    : "build",
	aliases : ['b'],
	options : [
		// Main file
		{
			name    : "main",
			type    : "File",
			default : "index.js",
			aliases : ['m']
		} ,
		// Type
		{
			name    : "type",
			type    : "enum",
			list    : ["app", "dll"],
			default : "app",
			aliases : ['t'],
		},
		// Cache
		{
			name    : "load-core-cache",
			type    : "Boolean",
			default : true,
			aliases : ['lcc']
		},
		{
			name    : "cache-directory",
			type    : "Directory",
			default : ".jeefo",
			aliases : ['cd']
		},
		// Output
		{
			name    : "output",
			type    : "Boolean",
			default : true,
			aliases : ['o']
		},
		{
			name    : "output-directory",
			type    : "Directory",
			default : "dist",
			aliases : ['od']
		},
		{
			name        : "name",
			type        : "String",
			default     : "app",
			aliases     : ['n'],
			description : "Only used for when output is true."
		},
		// DLL entry point files
		/*
		{
			name    : "files",
			type    : "Array",
			aliases : ['f'],
			description : "Only used for DLL(s)"
		},
		*/
		// Input
		{
			name        : "input-directory",
			type        : "Directory",
			default     : '.',
			aliases     : ['i'],
			description : "Default value '.' means current working directory."
		},
		// Config file
		{
			name        : "config-file",
			type        : "File",
			aliases     : ['cf'],
			description : "WARNING! Config file overrides all options."
		},
		// Environment
		{
			name        : "environment"        ,
			type        : "enum",
			list        : ["dev", "development", "prod", "production"],
			default     : "development",
			aliases     : ['e'],
			description : "dev, development and prod, production are identical."
		},
	],
    description : "Builds your App or DLL and places it into the output directory (dist/ by default).",
    execute : function (options) {
		// todo: override options
		if (options["config-file"]) {
			set_config_file(options["config-file"], options);
		}

		// Basedir
		set_basedir(options["input-directory"]);

		// Output dir
		if (options.output) {
			config.name   = options.name;
			config.dist   = path.join(config.basedir, options["output-directory"]);
			config.output = true;
		}

		// Environment
		switch (options.environment) {
			case "dev" :
			case "development" :
				config.environment = "development";
				break;
			case "prod" :
			case "production" :
				config.environment = "production";
				break;
		}

		// Cache dir
		if (options.cache) {
			config.cache_path = path.join(config.basedir, options["cache-directory"], "cache.json");
		}

		// Pre includes
		if (options.pre_includes) {
			pre_includes(options.pre_includes);
		}

		// Build type
		if (options.type === "app") {
			// Set main
			config.type = "app";

			if (typeof options["load-core-cache"] === "string") {
				options["load-core-cache"] = options["load-core-cache"] === "true";
			}

			if (options["load-core-cache"]) {
				load_cores();
				config["load-core-cache"] = options["load-core-cache"];
			}

			var main    = path_resolve('.', `./${ options.main }`);
			config.main = main.path;

			parse(main);
			config.entry_points.push(main);
		} else {
			config.type = "dll";

			options.files.forEach(function (file) {
				file = path_resolve('.', `./${ file }`);

				parse(file);
				config.entry_points.push(file);
			});
		}

		// Output
		output(config);
	}
};
