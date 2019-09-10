#!/bin/bash -ex

VERSION=$(git describe --tags --abbrev=0)

rm -rf $VERSION && mkdir -p $VERSION
cp -r docs/* $VERSION
rm -rf assets enums interfaces modules *.html
cp -r docs/* .

