/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : utils.js
* Created at  : 2016-09-01
* Updated at  : 2017-02-18
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
 is_digit_int,
 map,
 assign,
 sprintf,
 json_parse,
 args_to_array,
*/

/* exported TEMP */

//ignore:end

var NULL      = null,
	ARRAY     = Array,
	OBJECT    = Object,
	slice     = [].slice,
	to_string = ({}).toString,
	TEMP,
	UNDEFINED,

args_to_array = function (args, index) {
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

is_digit = function (value, is_unsigned) {
	// SIGNED_DIGITS       = /^\-?\d+(?:.\d+)?$/
	// UNSIGNED_DIGITS     = /^\d+(?:.\d+)?$/
	return (is_unsigned ? /^\d+(?:.\d+)?$/ : /^\-?\d+(?:.\d+)?$/).test(value);
},

is_digit_int = function (value, is_unsigned) {
	// SIGNED_DIGITS_INT   = /^\-?\d+$/
	// UNSIGNED_DIGITS_INT = /^\d+$/
	return (is_unsigned ? /^\d+$/ : /^\-?\d+$/).test(value);
},

assign = (function () {
	if (is_undefined(OBJECT.assign)) {
		var object_assign = function (destination, source) {
			OBJECT.keys(source).forEach(function (key) {
				destination[key] = source[key];
			});
		};

		OBJECT.assign = function (destination) {
			// We must check against these specific cases.
			if (is_undefined(destination) || is_null(destination)) {
				throw new TypeError("Cannot convert undefined or null to object");
			}

			for (var index = 1, source, key; (source = arguments[index++]);) {
				if (is_defined(source) && ! is_null(source)) {
					if (source.hasOwnProperty) {
						object_assign(destination, source);
					} else {
						for (key in source) {
							destination[key] = source[key];
						}
					}
				}
			}

			return destination;
		};
	}

	return function () {
		return OBJECT.assign.apply(NULL, arguments);
	};
}()),

map = function () {
	var args = args_to_array(arguments);
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
		args  = args_to_array(arguments, 1);
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
},

json_parse = function (value) {
	try {
		return JSON.parse(value);
	} catch (e) {}
	return null;
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
	is_digit_int : is_digit_int,
	map : map,
	assign : assign,
	sprintf : sprintf,
	json_parse : json_parse,
};

/* exported */

//ignore:end
