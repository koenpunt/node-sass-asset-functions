var fs = require('fs');
var path = require('path');
var sass = require('sass');
var assetFunctions = require('../');

const { promisify } = require('util');

var renderAsync = function(file, options, done) {
  options = options || {};
  options.images_path = __dirname + '/images';
  options.fonts_path = __dirname + '/fonts';

  return new Promise((resolve, reject) => {
    // TODO: use sass.compileAsync instead
    sass.render({
      file: __dirname + '/scss/' + file,
      functions: assetFunctions(options)
    }, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const readFile = promisify(fs.readFile);

var equalsFileAsync = async function(file, suite, options) {
  const result = await renderAsync(file, options);
  var cssPath = path.join(cssDir, suite, file.replace(/\.scss$/, '.css'));

  const expected = await readFile(cssPath);
  expect(result.css.toString().trim()).toEqual(expected.toString().trim());
};

var sassDir = path.join(__dirname, 'scss');
var cssDir = path.join(__dirname, 'css');

var asset_host = function(http_path, done) {
  done('http://example.com');
};

var query_asset_cache_buster = function(http_path, real_path, done) {
  done('v=123');
};

var path_asset_cache_buster = function(http_path, real_path, done) {
  var extname = path.extname(http_path)
    , basename = path.basename(http_path, extname)
    , dirname = path.dirname(http_path);

  done({ path: path.join(dirname, basename + '-v123') + extname, query: null });
};

var files = fs.readdirSync(sassDir);

describe('basic', function() {
  test.each(files)('file: %s', (file) => {
    return equalsFileAsync(file, 'basic', {});
  });
});

describe('asset_host', function() {
  test.each(files)('file: %s', (file) => {
    return equalsFileAsync(file, 'asset_host', { asset_host: asset_host });
  });
});

describe('asset_cache_buster', function() {
  describe('using query', function() {
    test.each(files)('file: %s', (file) => {
      return equalsFileAsync(file, 'asset_cache_buster/query', { asset_cache_buster: query_asset_cache_buster });
    });
  });

  describe('using path', function() {
    test.each(files)('file: %s', (file) => {
      return equalsFileAsync(file, 'asset_cache_buster/path', { asset_cache_buster: path_asset_cache_buster });
    });
  });
});
