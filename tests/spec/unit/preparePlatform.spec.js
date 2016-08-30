var path = require('path');
var fs = require('fs');
var shell = require('shelljs');
var EventEmitter = require('events').EventEmitter;
var ConfigParser = require('cordova-common').ConfigParser;
var PluginInfo = require('cordova-common').PluginInfo;
var ConfigParser = require('cordova-common').ConfigParser;
var Api = require('../../../bin/templates/scripts/cordova/Api');

var FIXTURES = path.join(__dirname, 'fixtures');
var DUMMY = 'org.test.plugins.dummyplugin';

var iosProjectFixture = path.join(FIXTURES, 'ios-config-xml');
var iosProject = path.join(FIXTURES, 'dummyProj');
var iosPlatform = path.join(iosProject, 'platforms/ios');
var dummyPlugin = path.join(FIXTURES, DUMMY);

shell.config.silent = true;

describe('prepare after plugin add', function() {
    var api;
    beforeEach(function() {
        shell.mkdir('-p', iosPlatform);
        shell.cp('-rf', iosProjectFixture + '/*', iosPlatform);
        api = new Api('ios', iosPlatform, new EventEmitter());
        var customMatchers = {
            toBeInstalled: function() {
                var content = fs.readFileSync(path.join(iosPlatform, 'ios.json'));
                var cfg = JSON.parse(content);
                var installed =  Object.keys(cfg.installed_plugins).indexOf(this.actual) > -1;
                return installed == (arguments[0] || true);
            }
        };
        this.addMatchers(customMatchers);
    });

    afterEach(function() {
        shell.rm('-rf', iosPlatform);
    });

    it('should save plugin metadata correctly', function(done) {
        var project = {
            root: iosProject,
            projectConfig: new ConfigParser(path.join(iosProject, 'config.xml')),
            locations: {
                plugins: path.join(iosProject, 'plugins'),
                www: path.join(iosProject, 'www')
            }
        };

        var fail = jasmine.createSpy('fail')
        .andCallFake(function (err) {
            console.error(err);
        });

        api.prepare(project, {})
        .then(function() {
            expect(fs.existsSync(path.join(iosPlatform, 'ios.json'))).toBe(true);
            return api.addPlugin(new PluginInfo(dummyPlugin), {});
        })
        .then(function() {
            expect(DUMMY).toBeInstalled();
            return api.prepare(project, {});
        })
        .then(function() {
            expect(DUMMY).toBeInstalled();
        })
        .catch(fail)
        .finally(function() {
            expect(fail).not.toHaveBeenCalled();
            done();
        });
    });
});
