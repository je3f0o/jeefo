/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : header.js
* Created at  : 2017-09-01
* Updated at  : 2017-09-22
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var moment = require("moment"),

HEADER = `/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : FILE_NAME
* Created at  : DATE
* Updated at  : 
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

`;

module.exports = function (file_name) {
	return HEADER.
		replace("DATE", moment().format("YYYY-MM-DD")).
		replace("FILE_NAME", file_name);
};
