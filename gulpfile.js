'use strict';

var esdoc = require('gulp-esdoc');
var fs = require('fs');
var gulp = require('gulp');
var jscs = require('gulp-jscs');

var allSources = [
  'gulpfile.js',
  'test/**/*.js',
  'src/**/*.js',
];

gulp.task('jscs', ['lint'], function () {
  return gulp.src(allSources)
  .pipe(jscs())
  // .pipe(jscs.reporter('fail'))
  .pipe(jscs.reporter('console'));
});

// Documentation generation

gulp.task('docs', function () {
  var esdocSettings = JSON.parse(fs.readFileSync('esdoc.json'));
  return gulp.src('src')
  .pipe(esdoc(esdocSettings));
});
