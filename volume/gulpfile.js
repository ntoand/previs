var path = require('path');
var gulp = require('gulp');

var concat = require('gulp-concat');
//var size = require('gulp-size');
//var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
//var through = require('through');
//var os = require('os');
//var File = gutil.File;

var paths = {
	sharevol : [
	    "public/sharevol/lib/dat.gui.js",
	    "public/sharevol/lib/gl-matrix.js",
	    "public/sharevol/lib/OK.js",
	    "public/sharevol/src/slicer.js",
	    "public/sharevol/src/volume.js",
	    "public/sharevol/src/main.js"
	    ]
};

gulp.task('scripts.sharevol', function() {
    gulp.src(paths.sharevol)
        .pipe(concat('sharevol.js'))
        .pipe(gulp.dest('public/sharevol'))
        .pipe(uglify())
        .pipe(gulp.dest('public/sharevol'))
});