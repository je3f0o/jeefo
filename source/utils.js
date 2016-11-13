/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : utils.js
* Created at  : 2016-09-01
* Updated at  : 2016-11-14
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* exported
 is_undefined,
 is_defined,
 is_null,
 is_number,
 is_string,
 is_function,
 is_boolean,
 is_array,
 is_object,
 is_date,
 is_regex,
 is_digit,
 map,
 assign,
 sprintf,
*/

/* exported to_array, TEMP */

//ignore:end

var NULL      = null,
	ARRAY     = Array,
	OBJECT    = Object,
	slice     = [].slice,
	to_string = ({}).toString,
	TEMP,
	UNDEFINED,

to_array = function (args, index) {
	return slice.call(args, index);
},

compare_typeof_curry = function (type) {
	return function (value) {
		return typeof value === type;
	};
},

is_undefined = function (value) {
	return value === UNDEFINED;
},

is_defined = function (value) {
	return value !== UNDEFINED;
},

is_null = function (value) {
	return value === NULL;
},

is_number   = compare_typeof_curry("number"),
is_string   = compare_typeof_curry("string"),
is_boolean  = compare_typeof_curry("boolean"),
is_function = compare_typeof_curry("function"),

is_array = ARRAY.isArray,

is_object = function (value) {
	return ! is_null(value) && typeof value === "object";
},

is_date = function (value) {
	return to_string.call(value) === "[object Date]";
},

is_regex = function (value) {
	return to_string.call(value) === "[object RegExp]";
},

is_digit = function (value) {
	return /^\-?\d+$/.test(value);
},

assign = function () {
	return OBJECT.assign.apply(NULL, arguments);
},

map = function () {
	var args = to_array(arguments);
	args.unshift(OBJECT.create(NULL));
	return assign.apply(NULL, args);
},

OBJECT_PROPERTY_PLACEHOLDER_REGEX = /{\s*([^{}]+)\s*}/g,
INDEX_PLACEHOLDER_REGEX = /{\s*(\d+)\s*}/g,
sprintf = function (str, args) {
	var regex;
	if (is_object(args) && ! is_array(args)) {
		regex = OBJECT_PROPERTY_PLACEHOLDER_REGEX;
	} else {
		args  = to_array(arguments, 1);
		regex = INDEX_PLACEHOLDER_REGEX;
	}

	return str.replace(regex, function(match, key) { 
		key = key.trim();
		var value = args[key];
		if (is_function(value)) {
			return value() || '';
		} else if (is_defined(value)) {
			return value;
		}
		return match;
	});
};
//ignore:start

module.exports = {
	is_undefined : is_undefined,
	is_defined : is_defined,
	is_null : is_null,
	is_number : is_number,
	is_string : is_string,
	is_function : is_function,
	is_boolean : is_boolean,
	is_array : is_array,
	is_object : is_object,
	is_date : is_date,
	is_regex : is_regex,
	is_digit : is_digit,
	map : map,
	assign : assign,
	sprintf : sprintf,
};

/* exported to_array, _Object */

//ignore:end
