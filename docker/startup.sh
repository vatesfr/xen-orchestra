#!/bin/sh

cd /xen-orchestra
yarn
yarn build
yarn test-integration
#node_modules/.bin/jest packages/vhd-lib/src/Vhd/VhdAbstract.integ.spec.js
