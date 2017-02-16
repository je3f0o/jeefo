/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : utils_spec.js
* Created at  : 2016-09-01
* Updated at  : 2017-02-16
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported */
/* exported */

//ignore:end

// TODO: add sprintf test
var jeefo_path = (process.env.NODE_ENV === "production") ? "../jeefo.min" : "../source/utils";

var jeefo  = require(jeefo_path),
	expect = require("expect");

describe("Utils", function () {
	// is_undefined {{{3
	describe("is_undefined", function () {
		it("Should be undefined", function () {
			expect(jeefo.is_undefined()).toBe(true);
		});
		it("Should not be undefined", function () {
			expect(jeefo.is_undefined(jeefo)).toBe(false);
		});
	});

	// is_defined {{{3
	describe("is_defined", function () {
		it("Should be defined", function () {
			expect(jeefo.is_defined(jeefo)).toBe(true);
		});
		it("Should not be defined", function () {
			expect(jeefo.is_defined()).toBe(false);
		});
	});

	// is_null {{{3
	describe("is_null", function () {
		it("Should be null", function () {
			expect(jeefo.is_null(null)).toBe(true);
		});
		it("Should not be null", function () {
			expect(jeefo.is_null()).toBe(false);
		});
	});

	// is_number {{{3
	describe("is_number", function () {
		it("Should be number", function () {
			expect(jeefo.is_number(0)).toBe(true);
		});
		it("Should not be number", function () {
			expect(jeefo.is_number('0')).toBe(false);
		});
	});

	// is_string {{{3
	describe("is_string", function () {
		it("Should be string", function () {
			expect(jeefo.is_string("jeefo")).toBe(true);
		});
		it("Should not be string", function () {
			expect(jeefo.is_string(jeefo)).toBe(false);
		});
	});

	// is_boolean {{{3
	describe("is_boolean", function () {
		it("Should be boolean", function () {
			expect(jeefo.is_boolean(false)).toBe(true);
		});
		it("Should not be boolean", function () {
			expect(jeefo.is_boolean('true')).toBe(false);
		});
	});

	// is_function {{{3
	describe("is_function", function () {
		it("Should be function", function () {
			expect(jeefo.is_function(expect)).toBe(true);
		});
		it("Should not be function", function () {
			expect(jeefo.is_function(jeefo)).toBe(false);
		});
	});

	// is_object {{{3
	describe("is_object", function () {
		it("Should be object", function () {
			expect(jeefo.is_object(jeefo)).toBe(true);
		});
		it("Should not be object", function () {
			expect(jeefo.is_object(null)).toBe(false);
		});
	});

	// is_date {{{3
	describe("is_date", function () {
		it("Should be date object", function () {
			expect(jeefo.is_date(new Date())).toBe(true);
		});
		it("Should not be date object", function () {
			expect(jeefo.is_date(jeefo)).toBe(false);
		});
	});

	// is_regex {{{3
	describe("is_regex", function () {
		it("Should be regex object", function () {
			expect(jeefo.is_regex(/regex/)).toBe(true);
		});
		it("Should not be regex object", function () {
			expect(jeefo.is_regex()).toBe(false);
		});
	});

	// is_digit {{{3
	describe("is_digit", function () {
		it("Should be true when [string] looks like positive number", function () {
			expect(jeefo.is_digit("123")).toBe(true);
		});
		it("Should be true when [string] looks like negative number", function () {
			expect(jeefo.is_digit("-123")).toBe(true);
		});
		it("Should not be true [string] malformed", function () {
			expect(jeefo.is_digit("--123")).toBe(false);
			expect(jeefo.is_digit("123s")).toBe(false);
		});
	});

	// map: Empty prototype object {{{3
	describe("map", function () {
		var o = { a : 1, b : 2, c : 3 };
		var o2 = { e : 1, f : 2, g : 3 };
		var m = jeefo.map(o, null, undefined, o2);

		it("Should be new object merged objects", function () {
			Object.assign(o, o2);
			var result = ['a', 'b', 'c', 'e', 'f', 'g'].every(function (p) {
				return m[p] === o[p];
			});

			expect(result !== o).toBe(true);
			expect(result).toBe(true);
		});
	});

	// json_parse {{{3
	describe("json_parse", function () {
		it("Should be null when invalid object passed", function () {
			expect(jeefo.json_parse()).toBe(null);
			expect(jeefo.json_parse("invalid string")).toBe(null);
		});

		it("Should be parsed object", function () {
			var result = jeefo.json_parse(JSON.stringify({ property : "value" }));

			expect(jeefo.is_object(result)).toBe(true);
			expect(result.property).toBe("value");
		});
	});
	// }}}3
});
