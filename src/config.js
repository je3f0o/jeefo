/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : config.js
* Created at  : 2017-08-29
* Updated at  : 2017-09-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var path = require("path");

module.exports = {
	cache          : Object.create(null),
	requires       : [],
	global_dir     : path.join(__dirname, ".."),
	black_list     : {},
	pre_includes   : [],
	entry_points   : [],
	post_includes  : [],
	global_modules : ["states", "directives", "components"],
};
