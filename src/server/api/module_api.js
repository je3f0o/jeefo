/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : module_api.js
* Created at  : 2019-05-30
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

const path        = require("path");
const is_string   = require("@jeefo/utils/is/string");
const JeefoRouter = require("../../jeefo/router");
const app_bundler = require("../bundlers/app_bundler");

const router = new JeefoRouter();

router.register({
    path        : "module",
    method      : "GET",
    description : `
        Serve jeefo module with file descriptor info.
    `,
    query : {
        path : "Requested module's path",
    }
}, async (req, res) => {
    if (! is_string(req.query.path)) return res.sendStatus(400);

    const module = await app_bundler.get_module(req.query.path);
    if (! module) return res.sendStatus(404);

    const extension = path.extname(module.paths.absolute_path);
    res.type(extension);
    res.set("Last-Modified", module.mtime);
    res.send(module.content);
});

router.register({
    path        : "module/clear",
    method      : "DELETE",
    description : `
        Serve jeefo module with file descriptor info.
    `,
    query : {
        path : "Requested module's path",
    }
}, async (req, res) => {
    await app_bundler.clear();
    res.type(".txt").send("Done.");
});

module.exports = router;
