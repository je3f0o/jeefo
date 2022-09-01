/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : router.js
* Created at  : 2019-05-30
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

const path      = require("path");
const is_string = require("@jeefo/utils/is/string");

module.exports = {
  async create(bundler) {
    const routes = [];

    routes.push([{
      path        : "api/v1/jeefo/module",
      method      : "GET",
      description : `
        Serve jeefo module with file descriptor info.
      `,
      query : {
        path : "Requested module's path",
      }
    }, async (req, res) => {
      if (! is_string(req.query.path)) return res.sendStatus(400);

      const module = await bundler.get_module(req.query.path);
      if (! module) return res.sendStatus(404);

      const extension = path.extname(module.path.local.filepath);
      res.type(extension);
      res.set("Last-Modified", module.mtime);
      res.send(module.content);
    }]);

    routes.push([{
      path        : "api/v1/jeefo/clear",
      method      : "DELETE",
      description : `
        Serve jeefo module with file descriptor info.
      `,
      query : {
        path : "Requested module's path",
      }
    }, async (req, res) => {
      await bundler.clear();
      res.type(".txt").send("Done.");
    }]);

    routes.push([{
      path        : "js/jeefo_core.js",
      method      : "GET",
      description : ``,
    }, async (req, res) => res.sendFile(path.join(__dirname, "core.js"))]);

    return routes;
  }
};