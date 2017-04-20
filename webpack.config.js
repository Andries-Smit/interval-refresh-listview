const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: "./src/IntervalRefreshListview.ts",
    output: {
        path: path.resolve(__dirname, "dist/tmp"),
        filename: "src/IntervalRefreshListview/widget/IntervalRefreshListview.js",
        libraryTarget: "umd"
    },
    resolve: {
        extensions: [ ".ts", ".js" ],
        alias: {
            "tests": path.resolve(__dirname, "./tests")
        }
    },
    module: {
        rules: [
            { test: /\.ts$/, use: "ts-loader" },
            { test: /\.css$/, loader: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: "css-loader"
            }) }
        ]
    },
    devtool: "source-map",
    externals: [ /^mxui\/|^mendix\/|^dojo\/|^dijit\// ],
    plugins: [
        new CopyWebpackPlugin([ { from: "src/**/*.xml" } ], { copyUnmodified: true }),
        new ExtractTextPlugin({
            filename: "./src/IntervalRefreshListview/widget/ui/IntervalRefreshListview.css"
        }),
        new webpack.LoaderOptionsPlugin({ debug: true })
    ]
};
