/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo.js
* Created at  : 2017-05-06
* Updated at  : 2017-05-07
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

var make_module = require("./module");

// ignore:end

var Jeefo = function () {};

Jeefo.prototype = {
	use : function (middleware) {
		middleware(this);
	},
	module : function (name, requires) {
		if (is_array(requires)) {
			return make_module(name, requires);
		} else if (! MODULES.hasOwnProperty(name)) {
			min_error(`'${ name }' module is not found.`);
		}
		return MODULES[name];
	},
};

return {
	create : function () {
		return new Jeefo();
	}
};
