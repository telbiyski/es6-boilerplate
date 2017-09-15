module.exports.config = {
	livereload: true,
	sourcemaps: false,
	preprocessor: 'scss',
	index: 'index.html',
	autoprefix: {
		browsers: [
			'Chrome >= 35',
			'Firefox >= 38',
			'Edge >= 12',
			'Explorer >= 10',
			'iOS >= 8',
			'Safari >= 8',
			'Android 2.3',
			'Android >= 4',
			'Opera >= 12'
		]
	},
	main_css: 'style.scss',
	responsive_css: 'responsive.scss',
	vendors_file: 'vendors'
};
module.exports.folders = {
	source: 'src',
	build: 'dist',
	core: 'core',
	assets: 'assets',
	fonts: 'fonts',
	scripts: 'scripts',
	images: 'images',
	scss: 'scss',
	css: 'css',
	tasks: 'tasks'
};
module.exports.bundles = [
	{
		module: false,
		path: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
		deps: [
			{
				path: 'node_modules/jquery/dist/jquery.slim.min.js',
				global: true
			},
			{
				path: 'node_modules/tether/dist/js/tether.min.js',
				global: true
			}
		]
	},
	{
		module: false,
		css: 'node_modules/font-awesome/css/font-awesome.min.css',
		fonts: 'node_modules/font-awesome/fonts'
	}
];
module.exports.options = {
	environment: 'debug',
	application: {
		hostname: 'localhost',
		port: 80,
		version: {
			codeName: 'localhost',
			full: '1.0.0',
			major: 1,
			minor: 0,
			dot: 0
		}
	}
};
