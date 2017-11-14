/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : load_cores.js
* Created at  : 2017-08-29
* Updated at  : 2017-09-21
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var config = require("../../src/config"),
	cache  = config.cache,
	assign = require("jeefo_utils/object/assign");

var cache_path = "../../core/.jeefo/cache";

module.exports = function load_cores () {
	var core         = require(cache_path),
		paths        = core.paths, i = paths.length,
		black_list   = config.black_list,
		entry_points = core.entry_points;

	while (i--) {
		black_list[paths[i]] = true;
	}

	assign(cache, core.contents);

	for (i = 0; i < entry_points.length; ++i) {
		config.entry_points.push(cache[entry_points[i]]);
	}

	config.pre_includes = core.pre_includes;
};
