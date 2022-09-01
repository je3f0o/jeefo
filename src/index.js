/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-08-29
* Updated at  : 2022-09-01
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const jeefo_router  = require("./router");
const jeefo_bundler = require("./bundler");

const pwd = process.cwd();

const cache_dir    = `${pwd}/.caches`;
const frontend_dir = `${pwd}/frontend`;
const public_js_dir = `${pwd}/public/js`;

const default_config = {
  name         : "app.min.js",
  cache_dir    : `${cache_dir}/app`,
  output_dir   : public_js_dir,
  include_dirs : [frontend_dir],
  node_modules : [
    { root_dir : '.', packages : ["@jeefo"] },
  ],
};

module.exports = {
  async create(config = {}) {
    const {router} = config;
    const bundler = await jeefo_bundler.create({...default_config, ...config});
    const routes  = await jeefo_router.create(bundler);
    if (router) for (const route of routes) router.register(...route);
    return {bundler, routes};
  }
};