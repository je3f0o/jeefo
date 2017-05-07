/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : utils_spec.js
* Created at  : 2016-09-01
* Updated at  : 2017-05-04
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* globals */
/* exported */

//ignore:end

// TODO: add sprintf test
var jeefo  = require("../index"),
	expect = require("expect");

describe.only("Utils", () => {
	// is_object {{{2
	describe("is_object", function () {
		it("Should be object", function () {
			expect(jeefo.is_object(jeefo)).toBe(true);
		});
		it("Should not be object", function () {
			expect(jeefo.is_object(null)).toBe(false);
		});
	});

	// is_date {{{2
	describe("is_date", function () {
		it("Should be date object", function () {
			expect(jeefo.is_date(new Date())).toBe(true);
		});
		it("Should not be date object", function () {
			expect(jeefo.is_date(jeefo)).toBe(false);
		});
	});

	// is_regex {{{2
	describe("is_regex", function () {
		it("Should be regex object", function () {
			expect(jeefo.is_regex(/regex/)).toBe(true);
		});
		it("Should not be regex object", function () {
			expect(jeefo.is_regex()).toBe(false);
		});
	});

	// is_digit {{{2
	describe("is_digit", function () {
		it("Should be true when [string] looks like positive int number", function () {
			expect(jeefo.is_digit("123")).toBe(true);
		});
		it("Should be true when [string] looks like negative int number", function () {
			expect(jeefo.is_digit("-123")).toBe(true);
		});
		it("Should be false when [string] looks like negative int number and unsigned flag set", function () {
			expect(jeefo.is_digit("-123", true)).toBe(false);
		});
		it("Should be true when [string] looks like positive float number", function () {
			expect(jeefo.is_digit("3.14")).toBe(true);
		});
		it("Should be true when [string] looks like negative float number", function () {
			expect(jeefo.is_digit("-3.14")).toBe(true);
		});
		it("Should be false when [string] looks like negative float number and unsigned flag set", function () {
			expect(jeefo.is_digit("-3.14", true)).toBe(false);
		});
		it("Should be false [string] malformed", function () {
			expect(jeefo.is_digit("--123")).toBe(false);
			expect(jeefo.is_digit("123s")).toBe(false);
			expect(jeefo.is_digit("--3.14")).toBe(false);
			expect(jeefo.is_digit("3.14s")).toBe(false);
		});
	});

	// is_digit_int {{{2
	describe("is_digit_int", function () {
		it("Should be true when [string] looks like positive int number", function () {
			expect(jeefo.is_digit("123")).toBe(true);
		});
		it("Should be true when [string] looks like negative int number", function () {
			expect(jeefo.is_digit("-123")).toBe(true);
		});
		it("Should be false when [string] looks like negative int number and unsigned flag set", function () {
			expect(jeefo.is_digit("-123", true)).toBe(false);
		});
		it("Should be false [string] malformed", function () {
			expect(jeefo.is_digit("--123")).toBe(false);
			expect(jeefo.is_digit("123s")).toBe(false);
		});
	});

	// assign {{{2
	describe("assign", function () {
		var o = { a : 1, c : 4 };
		var r = jeefo.assign(o, null, undefined, { a : 2 }, { b : 3 });

		it("Should be same object instance", function () {
			expect(r === o).toBe(true);
		});
		it("Should be same property and values", function () {
			expect(o.a === 2).toBe(true);
			expect(o.b === 3).toBe(true);
			expect(o.c === 4).toBe(true);
		});
	});

	// object_create {{{2
	describe("object_create", function () {
		var o = { a : 1, b : 2, c : 3 };
		var o2 = { e : 1, f : 2, g : 3 };
		var m = jeefo.object_create(o, null, undefined, o2);

		it("Should be new object instance", function () {
			expect(m !== o).toBe(true);
		});
		it("Should be same property and values", function () {
			Object.assign(o, o2);
			var result = ['a', 'b', 'c', 'e', 'f', 'g'].every(function (p) {
				return m[p] === o[p];
			});
			expect(result).toBe(true);
		});
	});

	// json_parse {{{2
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
	// }}}2
});
