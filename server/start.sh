#!/bin/sh
cd "$(dirname "$0")" || exit 1
node build-db.js && exec ../node_modules/.bin/json-server --watch db.json --routes routes.json "$@"
