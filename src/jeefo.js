/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo.js
* Created at  : 2017-05-06
* Updated at  : 2017-05-10
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
		return this;
	},
};

return {
	create : function () {
		var modules = {},
			jeefo   = new Jeefo();

		jeefo.module = module;

		// jshint latedef : false
		return jeefo;

		function module (name, requires) {
			if (is_array(requires)) {
				if (modules.hasOwnProperty(name)) {
					min_error(`Duplicated module '${ name }' is detected.`);
				}
				return make_module(name, requires, modules);
			} else if (! modules.hasOwnProperty(name)) {
				min_error(`'${ name }' module is not found.`);
			}
			return modules[name].instance;
		}
		// jshint latedef : true
	}
};
