/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : paths.js
* Created at  : 2021-01-11
* Updated at  : 2021-01-12
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

const pwd = process.cwd();

module.exports = {
    root_dir       : pwd,
    npm_dir        : `${pwd}/node_modules`,
    cache_dir      : `${pwd}/.caches`,
    frontend_dir   : `${pwd}/frontend`,
    public_dir     : `${pwd}/public`,
    public_js_dir  : `${pwd}/public/js`,
    public_css_dir : `${pwd}/public/css`,
};
