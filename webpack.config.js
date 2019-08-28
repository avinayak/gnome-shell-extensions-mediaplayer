// i honestly have no clue how the gjs import system is supposed to work
// but i want nothing to do with it so here's webpack
// DOWNSIDES TO DOING THIS: lib.js is bundled twice (but it's not that big
// anyways so it's probably fine) since extension.js and prefs.js are separate
// scripts
module.exports = {
  // main extension
  entry: {
    extension: './src/extension.js',
    prefs: './src/prefs.js'
  },
  output: {
    filename: '[name]-build.js',
    libraryTarget: 'var',
    library: '[name]'
  },
  // don't generate super-minified js
  // if you want a mass of unreadable stuff then change this to 'production'
  mode: 'development',
  // don't wrap everything in eval
  devtool: false
};
