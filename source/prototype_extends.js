/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : prototype_extends.js
* Created at  : 2016-11-14
* Updated at  : 2016-11-14
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported */
/* exported */

var is_undefined = require("./utils").is_undefined;

var ARRAY  = Array,
	OBJECT = Object,
	TEMP;

if (! OBJECT.assign) {
	ARRAY = null;
}

//ignore:end

TEMP = ARRAY.prototype;

if (is_undefined(TEMP.last)) {
	TEMP.last = function () {
		return this[this.length - 1];
	};
}

if (is_undefined(TEMP.exists)) {
	TEMP.exists = TEMP.includes || function (value, index) {
		return this.indexOf(value, index) >= 0;
	};
}

if (is_undefined(TEMP.remove)) {
	TEMP.remove = function (value) {
		var index = this.indexOf(value);
		if (index >= 0) {
			return this.splice(index, 1);
		}
	};
}

if (is_undefined(TEMP.until)) {
	TEMP.until = function (iterator_callback, result_callback) {
		for (var i = 0, self = this, i_length = self.length, value; i < i_length; ++i) {
			value = self[i];
			if (iterator_callback(value, i, self)) {
				return result_callback(value, i, self);
			}
		}
	};
}
