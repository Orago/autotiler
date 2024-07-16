import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import { fileURLToPath } from 'url';

const __dirname = path.join(
	path.dirname(
		fileURLToPath(import.meta.url)
	),
	'./'
);

const devMode = process.argv.includes('--dev');
const analyzer = process.argv.includes('--analyze');

const quickSettings = {
	comments: false,
	optimize: true,
	devMode
};

const plugins = [];

if (quickSettings.devMode == true) {

}
else {
	plugins.push(
		new CompressionPlugin()
	);
}

/**
 * @type {import('webpack').Configuration}
 */
const webpackConfig = {
	mode: quickSettings.devMode ? 'development' : 'production',
	context: path.join(__dirname, './lib/'),
	entry: {
		main: __dirname + '/lib/app.ts',
	},
	// target: ['web', 'es2017'],
	output: {
		path: path.join(__dirname, './public/build'),
		filename: 'bundle.js',
		library: {
			type: 'module'
		},
		publicPath: '/build/'
	},
	plugins,
	cache: {
		type: 'memory'
	},
	devtool: quickSettings.devMode ? 'inline-source-map' : false,
	resolve: {
		modules: [
			path.resolve(__dirname, '../shared/lib'),
			'node_modules'
		],
		extensions: ['.tsx', '.ts', '.js', '.txt', '.html'],
		symlinks: true
	},

	module: {
		rules: [

			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						configFile: path.join(__dirname, '/babel.config.json')
						// "presets": ["@babel/preset-env"],
						// "plugins": []
					}
				}
			},
			{
				test: /\.(png|jpe?g|gif)$/i,
				use: [
					{
						loader: 'file-loader',
					},
				],
			},
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.txt/,
				type: 'asset/source',
			},
			{
				test: /\.html/,
				type: 'asset/source',
			}
		],
	},
	experiments: {
		outputModule: true,
	}
};

if (quickSettings.devMode === false) {
	webpackConfig.performance = {
		maxEntrypointSize: 512000,
		maxAssetSize: 512000,
	};

	webpackConfig.optimization = {
		usedExports: true,
		splitChunks: {
			minSize: 10000,
			maxSize: 250000,
			chunks: 'all'
		}
	};
}

if (quickSettings.optimize && webpackConfig.optimization != null) {
	const { optimization } = webpackConfig;
	optimization.minimize = true;
	optimization.minimizer = [];

	if (quickSettings.comments != true) {
		optimization.minimizer.push(
			new TerserPlugin({
				terserOptions: {
					format: {
						comments: false,
					},
				},
				extractComments: false,
			}),
		)
	}

	optimization.minimizer.push(
		new TerserPlugin({
			minify: TerserPlugin.esbuildMinify,

			// `terserOptions` options will be passed to `esbuild`
			// Link to options - https://esbuild.github.io/api/#minify
			// Note: the `minify` options is true by default (and override other `minify*` options), so if you want to disable the `minifyIdentifiers` option (or other `minify*` options) please use:
			// terserOptions: {
			//   minify: false,
			//   minifyWhitespace: true,
			//   minifyIdentifiers: false,
			//   minifySyntax: true,
			// },
			terserOptions: {
				// @ts-ignore
				minify: true,
				// @ts-ignore
				minifyWhitespace: true,
				// @ts-ignore
				minifySyntax: true
			},
		}),
	);
}

export default webpackConfig;