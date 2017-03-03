/**
 * This module is intended to be used for building the deployment ui
 */
import watchify from 'watchify';
var browserify = require('browserify');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var del = require('del');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var transform = require('vinyl-transform');
var lodash = require('lodash');

/**
 * Provides a js bundle definition
 *
 * @constructor
 * @param {String} name     The name of the bundle
 * @param {String} src      [optional] The filename of the source
 */
function JSBundle(name, src)
{
    var _self = this;

    this.name = name;
    this.src = src || name + '.js';
    this.target = name + '.js';
    this.exposed = [];
    this.externals = [];
    this.paths = [];

    /**
     * Define a dependency as external
     *
     * @param   {String}    name
     * @returns {JSBundle}
     */
    this.external = function(name)
    {
        this.externals.push(name);
        return this;
    };

    /**
     * Expose a dependency to be used as external by another package
     *
     * @param   {String}    name    The dependency to expose. Must be a node require
     * @param   {String}    as      [optional] The name this dependency wil be exported to
     * @returns {JSBundle}
     */
    this.expose = function(name, as)
    {
        var expose = {
            name: name,
            as: as || name
        };

        this.exposed.push(expose);
        return this;
    };

    /**
     * Add a source lookup path
     *
     * @param   {String}        path
     * @returns {JSBundle}
     */
    this.path = function(path)
    {
        this.paths.push(path);
        return this;
    };

    /**
     * Sets the target filename relative to the output directory
     *
     * @param   {String}    name
     * @returns {JSBundle}
     */
    this.setTargetName = function(name)
    {
        this.target = name;
        return this;
    };

    /**
     * Set the source filename
     *
     * @param   {String}    src
     * @returns {JSBundle}
     */
    this.setSrc = function(src)
    {
        this.src = src;
        return this;
    };

    /**
     * Creates the browserify bundle
     *
     * @protected
     * @params {String} baseDirectory
     * @params {String} debug
     * @return {Object}
     */
    this.createBrowserifyBundle = function(baseDirectory, debug)
    {
        // add custom browserify options here
        var options = {
            entries: baseDirectory + '/src/js/' + this.src,
            paths: lodash.map(this.paths, function(path) {
                return baseDirectory + '/' + path;
            }),
            debug: debug
        };

        if (debug) {
            var mergedOptions = lodash.assign({}, watchify.args, options);
            var bundle = watchify(browserify(mergedOptions));
        } else {
            var bundle = browserify(options);
        }

        lodash.forEach(this.exposed, function(exposed) {
            bundle.require(exposed.name, {expose: exposed.as});
        });

        lodash.forEach(this.externals, function(external) {
            bundle.external(external);
        });

        return bundle;
    };

    /**
     * Create the gulp task callback
     *
     * @protected
     * @param   {gulp}      gulp
     * @param   {String}    baseDirectory
     * @param   {String}    targetDirectory
     * @param   {Boolean}   debug
     * @returns {Function}
     */
    this.createTaskCallback = function(gulp, baseDirectory, targetDirectory, debug)
    {
        var bundle = this.createBrowserifyBundle(baseDirectory, debug);
        var bundleFile = this.target;

        bundle.on('log', gutil.log)
              .on('error', gutil.log.bind(gutil, 'Browserify Error'));

        function buildJs() {
            var result = bundle.bundle()
                               .pipe(source(bundleFile))
                               .pipe(buffer());

            if (debug) {
                result = result.pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
                               .pipe(sourcemaps.write()); // writes .map file
            } else {
                result = result.pipe(uglify({compress: { drop_console: true }}));
            }

            gutil.log('Creating ' + (debug? 'debug ' : '') + 'bundle "' + _self.name + '" to "' + targetDirectory + '"');
            return result.pipe(gulp.dest(targetDirectory));
        };

        if (debug) {
            gutil.log('Will watch bundle "' + _self.name + '"');
            bundle.on('update', buildJs); // on any dep update, runs the bundler
        }

        return buildJs;
    };
};

/**
 * Gulp Tools
 *
 * @constructor
 * @param {String} directory
 */
function GulpTools(directory, gulpInstance)
{
    var _self = this;
    var gulp = gulpInstance || require('gulp');
    var jsBundles = {};

    this.buildSass = false;
    this.gulp = gulp;
    this.targetDirectory = directory + '/assets/';
    this.sassOptions = {};

    /**
     * Add default sass build (with options)
     *
     * @param {Object} options [optional] Options passed to libsass
     * @return {GulpTools} this
     */
    this.sass = function(options)
    {
        this.buildSass = true;

        if (options) {
            this.sassOptions = options;
        }

        return this;
    };

    /**
     * Create a new js bundle for the given file
     *
     * @param {String} name The name of the bundle
     * @param {String} src [optional] The source filename. If omitted it will be name suffixed with '.js'
     * @return {JSBundle}
     */
    this.createJsBundle = function(name, src)
    {
        return new JSBundle(name, src);
    }

    /**
     * Add a js bundle to the build
     *
     * @param   {JSBundle|Srting}   bundle  The name of the bundle or a JSBundle instance
     * @param   {String}            src     [optional] The source file to build from
     * @returns {GulpTools} this
     */
    this.js = function(bundle, src)
    {
        if (typeof(bundle) == 'string') {
            bundle = this.createJsBundle(bundle, src);
        }

        jsBundles[bundle.name] = bundle;
        return this;
    };

    /**
     * Creates the gulp task sass callback
     *
     * @private
     * @param {String} src
     * @param {Boolean} debug
     */
    function createSassTaskCallback(src, debug)
    {
        return function () {
            var sassTask = gulp.src(src);

            if (debug) {
                sassTask = sassTask.pipe(sourcemaps.init())
                    .pipe(sass(_self.sassOptions).on('error', sass.logError))
                    .pipe(sourcemaps.write('./'));
            } else {
                sassTask = sassTask.pipe(sass(_self.sassOptions).on('error', sass.logError));
            }

            return sassTask.pipe(gulp.dest(_self.targetDirectory + '/css/'));
        };
    };

    /**
     * Creates the build configuration
     *
     * @returns gulp
     */
    this.build = function()
    {
        var watchDepends = [ 'clean' ];
        var buildDepends = [ 'clean' ];

        gulp.task('clean', function() {
            var remove = lodash.map(['css', 'js'], function(dir) {
                return _self.targetDirectory + '/' + dir;
            });

            return del(remove, {force: true});
        });

        if (this.buildSass) {
            var src = directory + '/src/scss/**/*.scss';

            gulp.task('css-debug', createSassTaskCallback(src, true));
            gulp.task('css-build', createSassTaskCallback(src, false));
            gulp.task('css-watch', ['css-debug'], function () {
                return gulp.watch(src, ['css-debug']);
            });

            watchDepends.push('css-watch');
            buildDepends.push('css-build');
        }

        var jsTasks = [];

        /**
         * @param {JSBundle} bundle
         */
        lodash.forEach(jsBundles, function(bundle) {
            var taskName = 'js-' + bundle.name;
            var jsTargetDir = _self.targetDirectory + '/js/';

            gulp.task(taskName + '-watch', bundle.createTaskCallback(gulp, directory, jsTargetDir, true));
            gulp.task(taskName + '-build', bundle.createTaskCallback(gulp, directory, jsTargetDir, false));

            jsTasks.push(taskName);
        });

        function addTaskSuffix(tasks, suffix) {
            return lodash.map(tasks, function(name) {
                return name + '-' + suffix;
            });
        };

        if (jsTasks.length) {
            gulp.task('js-watch', addTaskSuffix(jsTasks, 'watch'));
            gulp.task('js-build', addTaskSuffix(jsTasks, 'build'));

            watchDepends.push('js-watch');
            buildDepends.push('js-build');
        }

        gulp.task('watch', watchDepends);
        gulp.task('build', buildDepends);

        return gulp;
    };
};

module.exports = GulpTools;
