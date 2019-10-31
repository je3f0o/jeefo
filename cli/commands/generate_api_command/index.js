/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2019-01-22
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

const path          = require("path"),
	  exit          = require("@jeefo/command/helpers/exit"),
	  style         = require("@jeefo/command/misc/style"),
	  API_Generator = require("./api_generator.js");

module.exports = {
	name    : "generate-api",
	aliases : ["ga"],
	options : [
		{ name : "npm"              , type : "bool"   , default : true              , aliases : null   } ,
		//{ name : "files"          , type : "files"  , default : "index.js"        , aliases : ['f']  } ,
		{ name : "version"          , type : "string" , default : undefined         , aliases : ['v']  } ,
		{ name : "module-name"      , type : "string" , default : undefined         , aliases : ['n']  } ,
		{ name : "output-name"      , type : "string" , default : "jeefo_apis.json" , aliases : ['o']  } ,
		{ name : "input-directory"  , type : "dir"    , default : '.'               , aliases : ["id"] } ,
		{ name : "output-directory" , type : "dir"    , default : '.'               , aliases : ["od"] } ,
	],

	description : "Parsing source code files recursively and generate export informations.",
	execute     : function (options) {
		let result           = {},
			input_directory  = path.resolve(options["input-directory"]),
			output_directory = path.resolve(options["output-directory"]);

		options.files = [];
		const API_generator = new API_Generator(input_directory);

		if (options.npm) {
			let package_json_path = path.join(input_directory, "package.json");

			try {
				let pkg = require(package_json_path);
				if (pkg.main) {
					options.files.push(pkg.main);
				}
				if (pkg.name) {
					options["module-name"] = pkg.name;
				}
				if (pkg.version) {
					options.version = pkg.version;
				}
			} catch (e) {
				if (e.code === "MODULE_NOT_FOUND") {
					exit([
						style("Cannot find the package.json path:", "red"),
						style(`'${ package_json_path }'`, "cyan"),
					].join(' '));
				} else {
					exit([
						style("Cannot read the package.json path:", "red"),
						style(`'${ package_json_path }'`, "cyan"),
					].join(' '));
				}
			}
		}

		if (options["module-name"]) {
			result.module_name = options["module-name"];
		}
		if (options.version) {
			let version = options.version.split('.');
			result.version = {
				major : version[0],
				minor : version[1],
				micro : version[2],
			};
		}

		options.files.forEach(file_path => {
			try {
				API_generator.load_script(file_path);
			} catch (e) {
				if (e.code === "ENOENT") {
					exit([
						style("Cannot find the file path:", "red"),
						style(`'${ e.path }'`, "cyan"),
					].join(' '));
				} else {
					throw e;
				}
			}
		});

		console.log(result);
	}
};
