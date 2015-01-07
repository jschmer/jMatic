// Karma configuration
// Generated on Tue Jan 06 2015 11:01:12 GMT+0100 (Mitteleuropäische Zeit)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
        // libraries
        'lib/xml2json/xml2json.min.js',
        'lib/jQuery/jquery-2.1.3.min.js',
        'lib/angular/core/angular.js',
        'lib/angular/core/angular-mocks.js',
        'lib/angular/modules/route/angular-route.min.js',
        'lib/angular/modules/ngDialog/js/ngDialog.min.js',
        'lib/angular/modules/animate/angular-animate.min.js',
        'lib/angular/modules/toasty/js/ng-toasty.min.js',
        'lib/angular/mobile-ui/js/mobile-angular-ui.min.js',

        // my app
        'js/*.js',
        'test/*.js',
        'partials/*.html', // templates
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        'partials/*.html': ['ng-html2js']
    },

    ngHtml2JsPreprocessor: {
      // strip this from the file path
      stripPrefix: 'partials/',
      // prepend this to the
      prependPrefix: 'served/',

      // setting this option will create only a single module that contains templates
      // from all the files, so you can load them all with module('foo')
      moduleName: 'templates'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox', 'Chrome', 'IE'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
