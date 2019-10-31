/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : abstract_syntax_tree.js
* Created at  : 2019-01-22
* Updated at  : 2019-01-22
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

const HashTable = require("jeefo_command/src/hash_table");

module.exports = class AbstractSyntaxTree {
	constructor () {
		this.files_hash_table = new HashTable();
	}
};
