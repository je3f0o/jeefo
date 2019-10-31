/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : generate.js
* Created at  : 2017-09-01
* Updated at  : 2019-01-10
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

var fse            = require("fs-extra"),
	path           = require("path"),
	config         = require("../src/config"),
	header         = require("./header"),
	dash_case      = require("jeefo_utils/string/dash_case"),
	snake_case     = require("jeefo_utils/string/snake_case"),
	capitalize     = require("jeefo_utils/string/capitalize"),
	NAME_REGEX     = /NAME/g,
	SELECTOR_REGEX = /SELECTOR/g;

var get_content = function (name) {
	return fse.readFileSync(path.join(__dirname, `./template/${ name }.tmpl.js`), "utf8");
};

var write = function (file_name, content) {
	var file_path = path.join(config.basedir, file_name);
	fse.outputFileSync(file_path, content, "utf8");
};

var generate_directive = function (type, name) {
	var content   = get_content(type),
		file_name = `${ snake_case(name) }_${ type }.js`;

	content = content.
		replace(NAME_REGEX, name).
		replace(SELECTOR_REGEX, dash_case(name));

	write(file_name, header(file_name) + content);
};

var generate_service = function (name) {
	var content   = get_content("service"),
		file_name = `${ snake_case(name) }_service.js`;
	
	content = content.replace(NAME_REGEX, `${ capitalize(name) }Service`);

	write(file_name, header(file_name) + content);
};

var generate_state = function (name) {
	var content   = get_content("state"),
		file_name = `${ snake_case(name) }_state.js`;
	
	write(file_name, header(file_name) + content.replace(NAME_REGEX, name));
};

module.exports = {
	name        : "generate",
	aliases     : ['g'],
    options     : [
        { name: 'state'     , type: "String" , aliases: ['s'] } ,
        { name: 'service'   , type: "String" , aliases: ['S'] } ,
        { name: 'component' , type: "String" , aliases: ['c'] } ,
        { name: 'directive' , type: "String" , aliases: ['d'] } ,
    ],
    description : "Generates template files",
    execute : function (options) {
		if (options.state) {
			generate_state(options.state);
		}
		if (options.service) {
			generate_service(options.service);
		}
		if (options.directive) {
			generate_directive("directive", options.directive);
		}
		if (options.component) {
			generate_directive("component", options.component);
		}
	}
};
