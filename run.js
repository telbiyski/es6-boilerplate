let config = require('./project.js').config,
	options = require('./project.js').options,
	folders = require('./project.js').folders,
	express = require('express'),
	compression = require('compression'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	cors = require('cors'),
	lr = require('tiny-lr')(),
	watcher = require('chokidar'),
	notifier = require('node-notifier'),
	path = require('path'),

	mainBuilder = require('./' + folders.tasks + '/build.js'),
	coreBuilder = require('./' + folders.tasks + '/core.js'),
	lessBuilder = require('./' + folders.tasks + '/less.js'),
	scssBuilder = require('./' + folders.tasks + '/scss.js'),

	sep = path.sep,
	root = __dirname + sep,
	buildRoot = root + folders.build + sep,
	tasks = root + folders.tasks + sep,
	opt = {
		root: root,
		buildRoot: buildRoot,
		onDone: m => {
			console.log(m);
			notifier.notify({
				title: 'ES6-Builder',
				message: m,
				icon: tasks + 'favicon.png'
			});
		},
		onError: e => {
			console.log(e);
			notifier.notify({
				title: 'Error',
				message: e,
				icon: tasks + 'warning.png'
			});
		}
	},
	app = express(),
	oneYear = 1 * 365 * 24 * 60 * 60 * 1000;

if (process.argv[2] && process.argv[2] === 'skip') opt.skip = true;
//--------------END CONFIG---------------------//

mainBuilder(opt)
.then(() => {
	console.log('Building Core files...');
	return coreBuilder(opt);
})
.then(() => {
	console.log('Building CSS files...');
	if (config.preprocessor === 'less') return lessBuilder(opt);
	return scssBuilder(opt);
})
.then(() => {
	opt.onDone('Project setup complete.');
});
//--------------END BUILDERS---------------------//

function refresh(f) {
	let file = path.basename(f);
	lr.changed({
		body: {
			files: [file]
		}
	});
}

app.use(compression({threshold: 0}));

if (config.livereload) {
	lr.listen(35729);

	watcher.watch([buildRoot], {
		persistent: true
	})
	.on('add', f => {
		refresh(f);
	})
	.on('change', f => {
		refresh(f);
	})
	.on('unlink', f => {
		refresh(f);
	});

	app.use(require('connect-livereload')({hostname: options.application.hostname}));
}

app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static(buildRoot, {maxAge: oneYear}));

app.get('*', (req, res) => {
	let ext = path.extname(req.url);
	if (ext !== '.js' && ext !== '.json') {
		res.sendFile(buildRoot + config.index);
	} else {
		res.status(404).send('Not found');
	}
});

app.listen(options.application.port, () => {
	console.log('Application started on http://' + options.application.hostname + ':' + options.application.port);
});
