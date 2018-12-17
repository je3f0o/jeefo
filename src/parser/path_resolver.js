/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : path_resolver.js
* Created at  : 2017-08-08
* Updated at  : 2018-12-18
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var fse        = require("fs-extra"),
	path       = require("path"),
	config     = require("../config"),
	global_dir = config.global_dir,

	global_node_modules     = path.join(config.global_dir, "node_modules"),
	global_file_path_offset = config.global_dir.length + 1,

	basedir, base_node_modules, base_file_path_offset;

var resolve = function (paths) {
	var i = paths.length;
	while (i--) {
		if (fse.existsSync(paths[i].path)) {
			var file = {
				path      : paths[i].path.substring(paths[i].offset),
				is_global : paths[i].is_global
			};

			file.path = file.path.split('\\').join('/');

			file.__dirname  = path.dirname(file.path);
			file.__filename = path.basename(file.path);

			return file;
			//console.log(file);
			//process.exit();
		}
	}

	console.log("NOT FOUND !!! in path resolve");
	console.log(paths);
	throw new Error("FFF");
};

var get_filenames = function (file_path) {
	if (! file_path.endsWith(".js")) {
		return [
			`${ file_path }.js`,
			`${ file_path }/index.js`,
		];
	}

	return [ file_path ];
};

var add_path = function (paths, file_names, dirname, offset, is_global) {
	var i = file_names.length, path_name;
	while (i--) {
		path_name = path.join(dirname, file_names[i]);
		if (path_name.length < file_names[i].length) {
			offset = 0;
		}

		paths.push({
			path      : path.join(dirname, file_names[i]),
			offset    : offset,
			is_global : is_global
		});
	}
};

var parse_absolute_path = function (dirname, file_path) {
	if (file_path.startsWith("jeefo/")) {
		file_path = `jeefo_${ file_path.substring(6) }`;
	}

	var dirs       = dirname === '.' ? [] : dirname.split('/'),
		paths      = [],
		file_names = get_filenames(file_path), i = 0;
	
	add_path(paths, file_names, global_node_modules, global_file_path_offset, true);
	add_path(paths, file_names, base_node_modules, base_file_path_offset, false);

	dirname = basedir;
	for (; i < dirs.length; ++i) {
		dirname = path.join(dirname, dirs[i]);

		add_path(paths, file_names, path.join(dirname, "node_modules"), base_file_path_offset, false);
	}

	return resolve(paths);
};

var parse_relative_path = function (dirname, file_path, is_global) {
	var paths      = [],
		file_names = get_filenames(file_path), offset;

	if (is_global) {
		offset  = global_file_path_offset;
		dirname = path.join(global_dir, dirname);
	} else {
		offset  = base_file_path_offset;
		dirname = path.join(basedir, dirname);
	}
	add_path(paths, file_names, dirname, offset, is_global);

	return resolve(paths);
};

module.exports = function path_resolver (dirname, file_path, is_global) {
	return (file_path.charAt(0) === '.')
		? parse_relative_path(dirname, file_path, is_global)
		: parse_absolute_path(dirname, file_path);
};

module.exports.set_basedir = function (_basedir) {
	basedir               = _basedir;
	base_node_modules     = path.join(basedir, "node_modules");
	base_file_path_offset = basedir.length + 1;
};
