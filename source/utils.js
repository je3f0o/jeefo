/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : utils.js
* Created at  : 2016-09-01
* Updated at  : 2016-09-02
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

/* exported to_array, _Object */

//ignore:end

var toString = ({}).toString,
_Object = Object,
_Array = Array,
_null = null,
_undefined,

to_array = function (args, index) {
	// do not miss we are using call method.
	// it is just wrapper method for slice.call
	return [].slice.call(args, index);
},

compare_typeof_curry = function (type) {
	return function (value) {
		return typeof value === type;
	};
},

is_undefined = function (value) {
	return value === _undefined;
},

is_defined = function (value) {
	return value !== _undefined;
},

is_null = function (value) {
	return value === null;
},

is_number   = compare_typeof_curry("number"),
is_string   = compare_typeof_curry("string"),
is_boolean  = compare_typeof_curry("boolean"),
is_function = compare_typeof_curry("function"),

is_array = _Array.isArray,

is_object = function (value) {
	return ! is_null(value) && typeof value === "object";
},

is_date = function (value) {
	return toString.call(value) === "[object Date]";
},

is_regex = function (value) {
	return toString.call(value) === "[object RegExp]";
},

is_digit = function (value) {
	return /^\-?\d+$/.test(value);
},

assign = function () {
	return _Object.assign.apply(_null, to_array(arguments));
},

map = function () {
	/*
	 * few characters long, but maybe faster
	 *
	var o = _Object.create(_null);
	for (var i = 0, args = arguments, i_length = args.length; i < i_length; ++i) {
		assign(o, args[i]);
	}
	return o;
	*/
	return to_array(arguments).reduce(function (o, arg) {
		return assign(o, arg);
	}, _Object.create(_null));
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
