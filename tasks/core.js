module.exports = opt => {
	let gulp = require('gulp-param')(require('gulp'), process.argv),
		babel = require('gulp-babel'),
		sourcemaps = require('gulp-sourcemaps'),
		concat = require('gulp-concat'),
		uglify = require('gulp-uglify'),
		gulpif = require('gulp-if'),
		Promise = require('bluebird'),
		watcher = require('chokidar'),
		del = require('del'),
		path = require('path'),
		config = require('../project.js').config,
		folders = require('../project.js').folders,

		sep = path.sep,
		root = opt.root,
		buildRoot = opt.buildRoot,
		corePath = root + folders.core,
		srcPath = root + folders.source,
		assetsPath = buildRoot + folders.assets + sep,
		allFiles = sep + '**' + sep + '*',
		coreDirs = [corePath + allFiles],
		srcDirs = [srcPath + sep + '**' + sep + '*.js'],
		allDest = assetsPath + folders.scripts;

	function build(first) {
		return new Promise((resolve, reject) => {
			if (first && opt.skip) {
				resolve();
			} else {
				buildCore()
				.then(() => {
					return buildComponents();
				})
				.then(() => {
					if (!first && opt.onDone) opt.onDone('JS build successfully!');
					resolve();
				});
			}
		});
	}

	function buildComponents() {
		return new Promise((resolve, reject) => {
			gulp.src(srcDirs)
			.pipe(gulpif(config.sourcemaps, sourcemaps.init()))
			.pipe(babel({presets: ['es2015']}).on('error', e => { if (opt.onError) opt.onError(e.message + ':' + e.lineNumber); }))
			.pipe(uglify({
				compress: {
					negate_iife: false
				}
			}).on('error', e => { if (opt.onError) opt.onError(e.message + ':' + e.lineNumber); }))
			.pipe(gulpif(config.sourcemaps, sourcemaps.write('./')))
			.pipe(gulp.dest(buildRoot))
			.on('end', resolve);
		});
	}

	function buildCore() {
		return new Promise((resolve, reject) => {
			gulp.src(coreDirs)
			.pipe(gulpif(config.sourcemaps, sourcemaps.init()))
			.pipe(uglify({
				compress: {
					negate_iife: false
				}
			}).on('error', e => { if (opt.onError) opt.onError(e.message + ':' + e.lineNumber); }))
			.pipe(gulpif(config.sourcemaps, sourcemaps.write('./')))
			.pipe(gulp.dest(allDest))
			.on('end', resolve);
		});
	}

	return new Promise((resolve, reject) => {
		gulp.task('watch', function() {
			build(true)
			.then(() => {
				watcher.watch(coreDirs, {
					ignoreInitial: true,
					ignored: /[\/\\]\./,
					persistent: true
				})
				.on('change', () => {
					build();
				});
				resolve();
			});
		});
		gulp.start('watch');
	});
};
