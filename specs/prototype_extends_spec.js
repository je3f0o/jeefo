/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : prototype_extends_spec.js
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

//ignore:end

let jeefo_path = (process.env.NODE_ENV === "production") ? "../jeefo.min" : "../source/prototype_extends";
require(jeefo_path);

let expect = require("expect");

describe("Prototype Extends", () => {
	describe("Array Prototype Extends", () => {
		describe("last", () => {
			it("Should be 3", () => {
				let arr = [1,2,3];
				expect(arr.last()).toBe(3);
			});

		});

		describe("exists", () => {
			let arr = [1,2,3];
			it("Should be exists", () => {
				expect(arr.exists(2)).toBe(true);
			});

			it("Should not be exists", () => {
				expect(arr.exists(2, 2)).toBe(false);
			});
		});

		describe("remove", () => {
			it("Should be 2", () => {
				let arr = [1,2,3];
				arr.remove(3);
				expect(arr.length).toBe(2);
			});
		});

		describe("until", () => {
			it("Should be 25", () => {
				let arr = [1,2,3,4,5];
				let result = arr.until(v => v === 5, v => v * v);
				expect(result).toBe(25);
			});
		});
	});
});
