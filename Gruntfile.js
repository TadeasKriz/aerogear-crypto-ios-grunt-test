module.exports = function (grunt) {
    var http = require('http');
    var fs = require('fs');
    var util = require('./util.js');

    // put all these into config!
    var testFile = 'main-test.js';
    var targetDirectory = 'target';
    var resourcesDirectory = 'resources';
    var appiumServerInstance = null;

    var cleanup = function () {
        var webDriverInstance = grunt.option('webDriverInstance');
        if (webDriverInstance != null) {
            webDriverInstance.browser.quit();
        }
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.registerTask('clean', 'Clean task', function () {
        grunt.file.delete(targetDirectory);
    });

    grunt.registerTask('default', 'Default test task using JBoss AS', [
        'test',

        'finalCleanup']);

    grunt.registerTask('test', 'Test app', function () {
        var taskOptions = this.options({
            hostname: 'localhost',
            appiumPort: 4723,
            targetApp: __dirname + '/' + resourcesDirectory + '/target.app'//,
            //targetIpa: resourcesDirectory + '/target.ipa'
        });

        util.findOption(taskOptions, 'hostname');
        util.findOption(taskOptions, 'appiumPort');
        util.findOption(taskOptions, 'targetApp');
        //util.findOption(taskOptions, 'targetIpa');

        var done = this.async();
        var testUtils = require('./testUtils.js');
        appiumServerInstance = testUtils.startAppium({
            args: {
                app: taskOptions.targetApp,
                address: taskOptions.hostname,
                port: taskOptions.appiumPort,
                nodeconfig: null,
                launch: true,
                verbose: true
                //bundleId: 'org.aerogear.AeroGear-Crypto-Demo'
            },
            readyCallback: function () {

                grunt.log.writeln('Appium ready!');
                var webDriver = testUtils.createiOSWDBrowser(taskOptions.targetApp, taskOptions.hostname,
                    taskOptions.appiumPort);
                //var browserChain = browser.chain();

                var elements = null;
                var buttons = null;

                var password = 'right_password';
                var wrongPassword = 'wrong_password';
                var passwordsToAdd = 3;

                // TODO do we need it?
                webDriver.promise = webDriver.promise
                    .elementsByTagName('tableCell')
                    .then(function(els) {
                        if(els.length > 0) {
                            return webDriver.browser.clickElement(els[0]);
                        } else {
                            return null;
                        }
                    })
                    .elementByTagName('secureTextField')
                    .type(password)
                    .elementByTagName('button')
                    .click();

                for(var i = 0; i < passwordsToAdd; i++) {
                    webDriver.promise = webDriver.promise
                        .waitForElementByName('Add')
                        .elementByName('Add')
                        .click()
                        .waitForElementByName('Add Password')
                        .elementByXPath('textField[1]')
                        .type('Test account - ' + i)
                        .elementByXPath('textField[2]')
                        .type('test_username_' + i)
                        .elementByXPath('textField[3]')
                        .type('test_password_' + i)
                        .elementByName('Done')
                        .click();
                }

                // TODO this should be later than "mobile: background"
                for(var j = 0; j < passwordsToAdd; j++) {
                    webDriver.promise = webDriver.promise
                        .waitForElementByName('Add')
                        .elementByXPath('tableCell[' + (j + 1) + "]")
                        .should.eventually.exist
                        .elementByXPath('tableCell[' + (j + 1) + "]/staticText")
                        .getValue()
                        .should.become('Test account - ' + j)
                        .elementByXPath('tableCell[' + (j + 1) + "]")
                        .click()
                        .waitForElementByName('Details')
                        .elementByTagName('button')
                        .elementByXPath('staticText[2]')
                        .getValue()
                        .should.eventually.become('Test account - ' + j)
                        .elementByXPath('staticText[3]')
                        .getValue()
                        .should.eventually.become('test_username_' + j)
                        .elementByXPath('staticText[4]')
                        .click()
                        .getValue()
                        .should.eventually.become('test_password_' + j)
                        .elementByName('Back')
                        .click();
                }

                webDriver.promise = webDriver.promise
                    .execute('mobile: background', [{seconds: 1}])
                    .waitForElementByName('Login')
                    .elementByTagName('secureTextField')
                    .type(wrongPassword)
                    .elementByName('Login')
                    .click()
                    .waitForElementByName('Bummer')
                    .elementByName('Login failed!')
                    .should.eventually.exist
                    .elementByName('Bummer')
                    .click()
                    .elementByTagName('secureTextField')
                    .type(password)
                    .elementByName('Login')
                    .click();

                webDriver.promise = webDriver.promise
                    .fin(function() {
                        done(true);
                        return webDriver.browser.quit();
                    })
                    .done();


                grunt.option('webDriverInstance', webDriver);
                /*
                 browserChain
                 .elementsByTagName('textfield', function(err, els) {
                 if(els) {
                 browser.next('type', els[2], taskOptions.variantSecret + '\n', function(err) {

                 });
                 browser.next('type', els[1], taskOptions.variantID, function(err) {

                 });
                 browser.next('type', els[0], 'http://' + taskOptions.hostname + ':' + taskOptions.port + '/ag-push/', function(err) {

                 }); // TODO make them chain?
                 }
                 })
                 .elementsByTagName('button', function(err, els) {
                 if(els)  {
                 browser.next('clickElement', els[0], function(err){
                 browser.waitForCondition(function() {
                 return els[0].getText() == 'Registered';
                 }, function(err, boolean) {
                 if(!err && !boolean) {
                 return;
                 }
                 grunt.log.writelns(err);
                 grunt.log.writeln(boolean);
                 done(!err && boolean);
                 });
                 });
                 }
                 });*/
            },
            doneCallback: function () {

                grunt.log.writeln('Appium done');

            }
        });
    });

    grunt.registerTask('finalCleanup', 'Clean up used resources and shutdown JBoss AS', function () {
        cleanup();
    });

}