var babelify   = require('babelify');
var browserify = require('browserify');
var buffer     = require('vinyl-buffer');
var gulp       = require('gulp');
var source     = require('vinyl-source-stream');
var uglify     = require('gulp-uglify');

gulp.task('es6', function() {
    browserify({
        entries:    'src/vi-flatland-app.js',
        debug:      true,
        standalone: 'flatlandApp',
        noParse:    ['mathjs']
    })
    .transform(babelify, {presets: ['es2015']})
    .transform({ global: true }, 'browserify-shim')
    .bundle()
    .pipe(source('vi-flatland-app.js'))
    .pipe(gulp.dest(''));
});

gulp.task('deploy', function() {
    browserify({
        entries:    'src/vi-flatland-app.js',
        debug:      false,
        standalone: 'flatlandApp',
        noParse:    ['mathjs']
    })
    .transform(babelify, { presets: ['es2015'] })
    .transform({ global: true }, 'browserify-shim')
    .bundle()
    .pipe(source('vi-flatland-app.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(''));
});

gulp.task('default', ['es6']);
