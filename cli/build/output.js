/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : output.js
* Created at  : 2017-08-08
* Updated at  : 2018-05-06
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var fse      = require("fs-extra"),
	path     = require("path"),
	Contents = require("./contents");

var build_app = function (config, contents) {
	var code = `(function (global) { "use strict";

${ config.pre_includes.join("\n\n") }

${ contents.build_code() }

jeefo.require("node_modules/jeefo_zone/index.js");
jeefo.require("${ config.main }");
jeefo.require("node_modules/jeefo_bootstrap/index.js")(document);

}(this));`;

	var output_path;

	if (config.environment === "development") {
		output_path = path.join(config.dist, `${ config.name }.dev.js`);
	} else {
		output_path = path.join(config.dist, `${ config.name }-${ Date.now() }.js`);
	}

	fse.outputFileSync(output_path, code);
};

var build_mini_app = function (config, contents) {
	var code = `(function () { "use strict";

${ config.pre_includes.join("\n\n") }

${ contents.build_code() }

jeefo.require("${ config.main }");

}());`;

	var output_path;

	if (config.environment === "development") {
		output_path = path.join(config.dist, `${ config.name }.dev.js`);
	} else {
		output_path = path.join(config.dist, `${ config.name }-${ Date.now() }.js`);
	}

	fse.outputFileSync(output_path, code);
};

module.exports = function compile (config) {
	var i        = config.entry_points.length,
		contents = new Contents(config.cache);

	while (i--) {
		contents.add(config.entry_points[i]);
	}

	if (config.output) {
		// FIXME: later add build_app vs build_dll
		if (config["load-core-cache"]) {
			build_app(config, contents); 
		} else {
			build_mini_app(config, contents); 
		}
	}

	if (config.cache_path) {
		var cache = contents.build_cache();
		if (config.pre_includes) {
			cache.pre_includes = config.pre_includes;
		}

		cache.entry_points = config.entry_points.map(function (file) {
			return file.path;
		});

		fse.outputJsonSync(config.cache_path, cache, { spaces : 2 });
	}
};
