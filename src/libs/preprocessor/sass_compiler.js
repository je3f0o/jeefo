/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : sass_compiler.js
* Created at  : 2020-10-01
* Updated at  : 2022-09-01
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

const path = require("path");
const sass = require("sass");

const PLACEHOLDER_REGEX = /\/\*!([^\*]+)\*\//g;

const npm_dir = `${process.cwd()}/node_modules`;

module.exports = async (module, source_code) => {
    const {root_directory, local} = module.path;
    const result = sass.renderSync({
        data           : source_code,
        outputStyle    : "compressed",
        //outputStyle    : "expanded",
        //outputStyle    : "nested",
        //outputStyle    : "compact",
        includePaths   : [npm_dir, local.directory],
        indentedSyntax : true,
    });

    for (const included_filepath of result.stats.includedFiles) {
        let filepath = path.relative(root_directory, included_filepath);
        if (! filepath.startsWith("node_modules/")) {
            filepath = `./${filepath}`;
        }
        const included_module = await module.bundler.get_module(filepath);
        const {remote} = included_module.path;
        if (! module.dependencies.includes(remote.filepath)) {
            module.dependencies.push(remote.filepath);
        }
    }

    return result.css.toString().replace(
        PLACEHOLDER_REGEX,
        (_, $1) => `\${ ${$1.trim()} }`
    );
};