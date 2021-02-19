/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : config.js
* Created at  : 2021-01-11
* Updated at  : 2021-02-19
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

const {
    cache_dir,
    frontend_dir,
    public_js_dir,
} = require("./server/paths");

module.exports = {
    app_bundler : {
        name         : "app.min.js",
        cache_dir    : `${cache_dir}/app`,
        output_dir   : public_js_dir,
        include_dirs : [frontend_dir],
        node_modules : [
            {
                root_dir : '.',
                packages : ["@jeefo"]
            },
        ],
    }
};
