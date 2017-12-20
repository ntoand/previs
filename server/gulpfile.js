var path = require('path');
var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var rename = require('gulp-rename');

var paths = {
    meshviewer : [
	      "public/meshviewer/lib/dat.gui.js",
				"public/meshviewer/lib/gl-matrix.js",
				"public/meshviewer/lib/OK.js",
				"public/meshviewer/src/slicer.js",
				"public/meshviewer/src/mesh.js",
				"public/meshviewer/src/main.js"
    ],
	  sharevol : [
	      "public/sharevol/lib/dat.gui.js",
	      "public/sharevol/lib/gl-matrix.js",
	      "public/sharevol/lib/OK.js",
	      "public/sharevol/src/slicer.js",
	      "public/sharevol/src/volume.js",
	      "public/sharevol/src/main.js"
	  ],
	  separate_scripts: [
		    "public/js/local.js",
		    "public/js/tag.js",
		    "public/js/admin.js"
		]
};

gulp.task('scripts.sharevol', function() {
    gulp.src(paths.sharevol)
        .pipe(concat('sharevol.js'))
        .pipe(gulp.dest('public/sharevol'))
        .pipe(uglify())
        .pipe(gulp.dest('public/sharevol'))
});

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
