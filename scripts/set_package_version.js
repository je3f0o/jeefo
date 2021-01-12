/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : set_package_version.js
* Created at  : 2021-01-12
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

const fs = require("@jeefo/fs");

const version = process.argv[2];
if (! /^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`Invalid argument: ${version}`);
    process.exit(1);
}

(async function main () {
    const pkg_path = `${__dirname}/../src/package.json`;
    const pkg = await fs.load_json(pkg_path);

    pkg.version = version;
    await fs.save_json(pkg_path, pkg);
})();
