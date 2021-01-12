/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : update_package_version.js
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

let version_type = "micro";

switch (process.argv[2]) {
    case "micro" :
    case "major" :
        version_type = process.argv[2];
        break;
    case undefined: break;
    default:
        console.error(`Invalid argumnet: ${process.argv[2]}`);
        process.exit(1);
}

(async function main () {
    const pkg_path = `${__dirname}/../src/package.json`;
    const pkg = await fs.load_json(pkg_path);

    const old_version = pkg.version;
    let [major, minor, micro] = old_version.split('.');

    switch (version_type) {
        case "micro" :
            micro = (+micro) + 1;
            break;
        case "minor" :
            minor = (+minor) + 1;
            break;
        case "major" :
            major = (+major) + 1;
            break;
    }
    pkg.version = `${major}.${minor}.${micro}`;
    await fs.save_json(pkg_path, pkg);

    process.stdout.write(`${old_version},${pkg.version}`);
})();
