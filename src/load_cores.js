/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : load_cores.js
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

var cache  = require("./cache"),
	config = require("./config"),
	assign = require("jeefo_utils/object/assign");

module.exports = function load_cores () {
	var cores_cache = require("../core/.cache/files");

	assign(cache, cores_cache);
	config.pre_includes = require("../core/.cache/config").pre_includes;
};
