#!/bin/bash -ex

VERSION=$(ls docs/versions/)

rm -rf assets enums interfaces modules *.html versions/$VERSION
cp -r docs/* .

