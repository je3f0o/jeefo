#!/bin/bash

node build && echo "Build succeed!"
yarn publish . && echo "Successfully published !"
