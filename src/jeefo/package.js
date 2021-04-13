/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : package.js
* Created at  : 2021-01-11
* Updated at  : 2021-04-13
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

const fs         = require("fs");
const path       = require("path");
const Readonly   = require("@jeefo/utils/object/readonly");
const {root_dir} = require("../server/paths");

const pkg_path = path.normalize(`${root_dir}/package.json`);
const pkg      = JSON.parse(fs.readFileSync(pkg_path, "utf8"));

class JeefoPackage {
    constructor () {
        const readonly = new Readonly(this);
        readonly.prop("get", props => {
            let result = pkg;
            for (const p of props.split('.')) {
                if (p in result) {
                    result = result[p];
                } else {
                    return null;
                }
            }
            return result === pkg ? null : result;
        });
    }
}

module.exports = new JeefoPackage();
