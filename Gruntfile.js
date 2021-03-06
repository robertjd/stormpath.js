'use strict';

module.exports = function (grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bump: {
      options:{
        files: ['package.json','bower.json'],
        updateConfigs: ['pkg'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json','bower.json','dist/stormpath.js','dist/stormpath.min.js','README.md'],
        createTag: true,
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin master'
      }
    },
    concat: {
      js:{
        options: {
          banner: '/*\n' +
            ' Stormpath.js v<%= pkg.version %>\n' +
            ' (c) 2014 Stormpath, Inc. http://stormpath.com\n'+
            ' License: Apache 2.0\n' +
            '*/\n'
        },
        files: {
          'dist/stormpath.js': ['tmp/stormpath.js'],
          'dist/stormpath.min.js': ['tmp/stormpath.min.js']
        }
      },
      md:{
        options:{
          process: function(src) {
            return src.replace(/[0-9]\.[0-9]\.[0-9]/g, grunt.config.get('pkg.version'));
          },
        },
        files: {
          'README.md': ['README.md'],
        }
      }
    },
    connect: {
      fakeapi: {
        options: {
          middleware: require('./test/fakeapi'),
          port: 8085
        },
      },
    },
    browserify: {
      tmp: {
        src: ['./lib/index.js'],
        dest: 'tmp/stormpath.js',
        options: {
          bundleOptions: {
            standalone: 'Stormpath'
          }
        }
      }
    },
    uglify: {
      tmp: {
        files: {
          'tmp/stormpath.min.js': ['tmp/stormpath.js']
        }
      }
    },
    clean: ['./tmp'],
    instrument: {
      files: 'lib/**/*.js',
      options: {
        lazy: true,
        basePath: '.tmp/instrumented/'
      }
    },
    watch: {
      src:{
        files: ['lib/**/*.js'],
        tasks: ['build','karma:liveunit:run']
      },
      unitTest:{
        files: ['test/**/*.js'],
        tasks: ['karma:liveunit:run']
      }
    },
    // Test settings
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      },
      liveunit: { // starts a karma server in the background
        configFile: 'karma.conf.js',
        background: true
      }
    },
    prompt: {
      release: {
        options:{
          questions:[
            {
              config: 'release.confirmed',
              message: 'Ready for release? This will version the files and push them to master',
              type: 'confirm',
              default: false
            }
          ]
        }
      }
    }
  });

  grunt.registerTask('default', ['browserify']);

  grunt.registerTask('test', ['connect:fakeapi','karma']);

  grunt.registerTask('build', ['clean','browserify:tmp','uglify:tmp']);

  grunt.registerTask('dist', ['build','concat:js','concat:md']);

  grunt.registerTask('release', function (target){
    grunt.registerTask('_release', function (){
      var t = grunt.config.get('release.confirmed');
      if(!t){
        grunt.fail.warn('You have aborted the release task.');
      }
      grunt.task.run(['bump-only:'+(target||'patch'),'dist','bump-commit']);
    });
    grunt.task.run(['prompt:release','_release']);
  });

  grunt.registerTask('dev', ['karma:liveunit','connect:fakeapi','watch']);

};