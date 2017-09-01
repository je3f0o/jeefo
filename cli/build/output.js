/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : output.js
* Created at  : 2017-08-08
* Updated at  : 2017-09-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var fse      = require("fs-extra"),
	path     = require("path"),
	Contents = require("./contents");

var build_app = function (config, contents) {
	var code = `(function () { "use strict";

${ config.pre_includes.join("\n\n") }

${ contents.build_code() }

jeefo.require("${ config.main }");
jeefo.require("node_modules/jeefo_bootstrap/index.js")(document);

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
		if (config.type === "app") {
			build_app(config, contents);
		}
	}

	if (config.cache_path) {
		var cache = contents.build_cache();
		if (config.pre_includes) {
			cache.pre_includes = config.pre_includes;
		}

		cache.entry_points = config.entry_points.map(file => file.path);

		fse.outputJsonSync(config.cache_path, cache, { spaces : 2 });
	}
};
