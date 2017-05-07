/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo.js
* Created at  : 2017-05-06
* Updated at  : 2017-05-06
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
	module : make_module,
};

return {
	create : function () {
		return new Jeefo();
	}
};
