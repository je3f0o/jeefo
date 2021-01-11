/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : sass_compiler.js
* Created at  : 2020-10-01
* Updated at  : 2021-01-11
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const sass      = require("sass");
const {npm_dir} = require("../../paths");

const PLACEHOLDER_REGEX = /\/\*!([^\*]+)\*\//g;

module.exports = async (module, source_code) => {
    const result = sass.renderSync({
        data           : source_code,
        outputStyle    : "compressed",
        //outputStyle    : "expanded",
        //outputStyle    : "nested",
        //outputStyle    : "compact",
        includePaths   : [npm_dir, module.paths.absolute_dir],
        indentedSyntax : true,
    });

    for (const f of result.stats.includedFiles) {
        const r = await module.bundler.get_module(f);
        const {paths:{relative_path}} = r;
        if (! module.dependencies.includes(relative_path)) {
            module.dependencies.push(relative_path);
        }
    }

    return result.css.toString().replace(
        PLACEHOLDER_REGEX,
        (_, $1) => `\${ ${$1.trim()} }`
    );
};
