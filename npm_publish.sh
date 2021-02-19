#!/bin/bash

version_type=micro

case $1 in
    minor|major)
    version_type=$1
esac

result=$(node scripts/update_package_version.js "$version_type")
old_version=$(echo "$result" | cut -f1 -d ',')
new_version=$(echo "$result" | cut -f2 -d ',')

pushd src
npm publish

if [ $? == 0 ]; then
    popd
    git add . && git c "version: ${new_version}" && git p
    echo "Successfully published new version: '${new_version}'"
else
    echo "Failed to publish and set version back to '${old_version}'"
    node ../scripts/set_package_version.js "$old_version"
fi
