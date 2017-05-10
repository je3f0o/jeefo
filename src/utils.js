/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : utils.js
* Created at  : 2016-09-01
* Updated at  : 2017-05-10
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* globals */
/* exported */

/* exported */


	//slice              = ARRAY_PROTOTYPE.slice,

/*
is_object = function (value) {
	return value !== null && typeof value === "object";
},


*/

//ignore:end

var ARRAY = Array,
is_array = ARRAY.isArray,
object_keys = Object.keys,
assign = function (destination) {
	for (var i = 1, source, keys, j; i < arguments.length; ++i) {
		if ((source = arguments[i])) {
// ignore:start
var KEY = PP.define("KEY", keys[j]);
// ignore:end
			// jshint curly : false
			for (keys = object_keys(source), j = keys.length - 1; j >= 0; destination[KEY] = source[KEY], --j);
			// jshint curly : true
		}
	}

	return destination;
},
min_error = function (message) {
	throw new Error(message);
};

//ignore:start

/*
OBJECT_PROPERTY_PLACEHOLDER_REGEX = /{\s*([^{}]+)\s*}/g,
INDEX_PLACEHOLDER_REGEX = /{\s*(\d+)\s*}/g,
sprintf = function (str, args) {
	var regex;
	if (is_object(args) && ! is_array(args)) {
		regex = OBJECT_PROPERTY_PLACEHOLDER_REGEX;
	} else {
		args  = slice.call(arguments, 1);
		regex = INDEX_PLACEHOLDER_REGEX;
	}

	return str.replace(regex, function(match, key) { 
		var value = args[key.trim()];
		if (IS_FUNCTION(value)) {
			return value() || '';
		} else if (IS_DEFINED(value)) {
			return value;
		}
		return match;
	});
},
*/

module.exports = {
	assign,
	min_error,
};

//specs:start

var expect = require("expect");

// Utils {{{1
describe("Utils", function () {
	// assign {{{2
	describe("assign", function () {
		var o = { a : 1, c : 4 };
		var r = assign(o, null, undefined, { a : 2 }, { b : 3 }, { c : 10 });

		it("Should be same object instance", function () {
			expect(r === o).toBe(true);
		});
		it("Should be same property and values", function () {
			expect(o.a === 2).toBe(true);
			expect(o.b === 3).toBe(true);
			expect(o.c === 10).toBe(true);
		});
	});
	// }}}2
});
// }}}1

//specs:end

//ignore:end
