/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : config.js
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

const pkg_path = path.normalize(`${__dirname}/../../package.json`);
console.log(__dirname);
console.log(pkg_path);
const pkg = JSON.parse(fs.readFileSync(pkg_path, "utf8"));

class JeefoConfigService {
    constructor () {

    }
}

module.exports = new JeefoConfigService();
