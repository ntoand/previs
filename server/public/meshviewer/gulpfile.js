const gulp = require('gulp');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);
const concat = require('gulp-concat');
const gutil = require('gulp-util');
const del = require('del');

var js_src_files = ['js/global.js', 'js/renderer.js', 'js/main.js']; 
gulp.task('combine', function() {
    gulp.src(js_src_files)
        .pipe(concat('meshviewer-all.min.js'))
        .pipe(gulp.dest('js'))
});

gulp.task('compress', function() {
    gulp.src(js_src_files)
        .pipe(concat('meshviewer-all.min.js'))
        .pipe(gulp.dest('js'))
        .pipe(uglify())
        .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(gulp.dest('js'))
});

gulp.task('watch', function() {
    gulp.watch(js_src_files, ['combine']);
});
 
gulp.task('default', ['watch']);