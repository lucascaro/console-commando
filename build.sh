#!/bin/bash -ex

VERSION=$(git describe --tags --abbrev=0)

rm -rf versions/$VERSION && mkdir -p versions/$VERSION
cp -r docs/* versions/$VERSION
rm -rf assets enums interfaces modules *.html
cp -r docs/* .

