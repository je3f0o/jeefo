/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : topological_sort_spec.js
* Created at  : 2016-09-01
* Updated at  : 2016-09-02
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

if (process.env.NODE_ENV === "production") { return; }

var sort   = require("../source/topological_sort");
var expect = require("expect");

var subscribers = {
    foo      : { dependencies : ['options'                ] } ,
    bar      : { dependencies : ['options', 'html'        ] } ,
    value    : { dependencies : ['options', 'html'        ] } ,
    options  : { dependencies : [                         ] } ,
    html     : { dependencies : ['foo'                    ] } ,
    css      : { dependencies : ['value', 'bar'           ] } ,
    elements : { dependencies : ['css', 'html', 'options' ] }
};

var expects = [
	"options",
	"foo",
	"html",
	"value",
	"bar",
	"css",
	"elements"
];

describe("Topological sort", function () {
	it("Should be sorted", function (done) {
		var result = sort("elements", function (name) {
			return subscribers[name].dependencies;
		}).every(function (value, index) {
			return value === expects[index];
		});

		expect(result).toBe(true);
		done();
	});
});
