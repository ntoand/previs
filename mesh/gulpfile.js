var path = require('path');
var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var rename = require('gulp-rename');

var paths = {
	sharevol : [
	    "public/sharemesh/lib/dat.gui.js",
	    "public/sharemesh/lib/gl-matrix.js",
	    "public/sharemesh/lib/OK.js",
	    "public/sharemesh/src/slicer.js",
	    "public/sharemesh/src/mesh.js",
	    "public/sharemesh/src/main.js"
	    ],
	separate_scripts: [
		"public/js/local.js",
		"public/js/daris.js",
		"public/js/tag.js"
		]
};

gulp.task('scripts.mesh', function() {
    gulp.src(paths.sharemesh)
        .pipe(concat('mesh.js'))
        .pipe(gulp.dest('public/mesh'))
        .pipe(uglify())
        .pipe(gulp.dest('public/mesh'))
});

gulp.task('scripts', function() {
    gulp.src(paths.separate_scripts)
    	.pipe(uglify())
    	.pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('public/js'))
});
