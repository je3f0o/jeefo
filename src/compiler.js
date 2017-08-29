/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : compiler.js
* Created at  : 2017-08-08
* Updated at  : 2017-08-29
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var fse    = require("fs-extra"),
	path   = require("path"),
	cache  = require("./cache"),
	config = require("./config");

module.exports = function compile (to_build) {
	var code = Object.keys(cache).map(path => {
		var file = cache[path];
		return file.content;
	}).join("\n\n");

	var params = '', pre_includes = '', post_includes = '', args = '';

	if (config.pre_includes.length) {
		pre_includes = config.pre_includes.join("\n\n") + "\n\n";
	}

	if (config.jeefo.main) {
		post_includes += `

jeefo.require("${ config.main }");
jeefo.require("node_modules/jeefo_bootstrap/index.js")(document);`;
	}

	code = `(function (${ params }) { "use strict";\n\n${ pre_includes }${ code }${ post_includes }\n\n}(${ args }));`;

	if (to_build) {
		var dist = path.join(config.basedir, config.jeefo.dist, `${ config.jeefo.name }-${ Date.now() }.js`);

		// Distribution
		fse.outputFileSync(dist, code);
		
		// Clean old file
		if (fse.existsSync(config.config_cache_path)) {
			var old_dist = require(config.config_cache_path).dist;
			if (fse.existsSync(old_dist)) {
				fse.removeSync(old_dist);
			}
		}

		// Cache config
		fse.outputJsonSync(config.config_cache_path, {
			dist         : dist,
			pre_includes : config.pre_includes
		}, { spaces : 2 });

		// Cache files
		fse.outputJsonSync(config.files_cache_path, cache, { spaces : 2 });
	} else {
		// Debug
		fse.outputFileSync(config.debug_path, code);
	}
};
