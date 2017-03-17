/**
 * The default gulpfile
 */

import {GulpTool} from './GulpTool';

let project = new GulpTool(__dirname);

project.sass()
	.js(
		project.createJsBundle('app')
			.path(__dirname + '/src/ts')
	)
	.build();