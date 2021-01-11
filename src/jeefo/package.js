/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : package.js
* Created at  : 2021-01-11
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

const fs       = require("fs");
const path     = require("path");
const Readonly = require("@jeefo/utils/object/readonly");

const pkg_path = path.normalize(`${__dirname}/../package.json`);
const pkg      = JSON.parse(fs.readFileSync(pkg_path, "utf8"));

class JeefoPackage {
    constructor () {
        const readonly = new Readonly(this);
        readonly.prop("get", props => {
            let result = pkg;
            for (const p of props.split('.')) {
                result = result[p];
            }
            return result === pkg ? null : result;
        });
    }
}

module.exports = new JeefoPackage();
