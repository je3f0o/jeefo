/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : builder.js
* Created at  : 2016-11-26
* Updated at  : 2017-08-20
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported */
/* exported */

//ignore:end

let fse           = require("fs-extra"),
	path          = require("path"),
	parser        = require("./parser"),
	parse_comment = require("./parse_comment");

class JeefoNGBuilder {

	constructor (parsed_options) {
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
	}

	init_config () {
		this.config   = fse.readJsonSync(this.jeefo_json_path);
		this.base_dir = process.cwd();

		let user_options = this.user_options;
		let dist_dir     = user_options["output-directory"] || path.resolve(this.base_dir, this.config.dist_dir);

		this.module_name = user_options.module || this.config.name;
		this.output_file = path.resolve(dist_dir, this.module_name);
		if (! this.module_name.endsWith(".js")) {
			this.output_file += ".js";
		}

		this.main = "./" + this.config.main;

		return this;
	}

	parse_source_files () {
		var file = {
			path       : this.main,
			__dirname  : path.join(path.dirname(this.main)),
			__filename : path.basename(this.main),
		};
		file.full_path = path.join(file.__dirname, file.__filename);

		this.cache = parser.parse_source_file(file, this.base_dir);
	}

	compile () {
		var pre_includes = '', post_includes = '',
			code = '', params = '', args = '';

		if (this.config.pre_includes) {
			pre_includes = this.config.pre_includes.reduce((result, filepath) => {
				return result + fse.readFileSync(filepath, "utf8") + "\n\n";
			}, '');
		}
		if (this.config.post_includes) {
			post_includes = this.config.post_includes.reduce((result, filepath) => {
				return result + "\n\n" + fse.readFileSync(filepath, "utf8");
			}, '');
		}
		if (this.config.globals) {
			var globals = this.config.globals;
			args   = [];
			params = [];
			Object.keys(globals).forEach(function (param) {
				args.push(globals[param]);
				params.push(param);
			});
			args   = args.join(", ");
			params = params.join(", ");
		}
		if (this.cache) {
			code = Object.keys(this.cache).map(path => {
				var file = this.cache[path];
				return file.content;
			}).join("\n\n");
		}

		code = `(function (${ params }) { "use strict";\n\n${ pre_includes }${ code }${ post_includes }\n\n}(${ args }));`;

		fse.outputFileSync(this.output_file, code);
	}

	build () {
		if (this.config.main) {
			this.parse_source_files();
		}
		this.compile();

		console.log(`[${ this.module_name }] - Build succeeded!`);
	}

	error (message) {
		console.error(`ERROR : ${ message }`);
		process.exit(1);
	}

}

module.exports = JeefoNGBuilder;
