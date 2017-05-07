/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-05-03
* Updated at  : 2017-05-07
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var _package = require("./package");

module.exports = require(`./dist/${ _package.name }.node`);
