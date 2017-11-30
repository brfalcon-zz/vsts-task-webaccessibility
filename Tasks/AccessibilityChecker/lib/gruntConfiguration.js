const path = require('path');

function GruntConfiguration(grunt) {
    this.gruntObj = grunt;
}

GruntConfiguration.prototype.getConfig = function () {
    'use strict';

    var urlfile;
    var urls = [];
    var loginurl;
    var userControlName;
    var passControlName;
    var user;
    var pass;
    var titleToWait;
    var continueOnErrors;
    var loginButtonName;

    var options = {};
    var config = {};

    config.loginurl = this.gruntObj.option('loginurl');
    config.userControlName = this.gruntObj.option('userControlName');
    config.passControlName = this.gruntObj.option('passControlName');
    config.user = this.gruntObj.option('user');
    config.pass = this.gruntObj.option('pass');
    config.titleToWait = this.gruntObj.option('titleToWait');
    config.loginButtonName = this.gruntObj.option('loginButtonName');
    config.testResultPath = this.gruntObj.option('testResultPath');

    options.browser = "phantomjs";

    if (this.gruntObj.option('urlfile')) {
        urlfile = this.gruntObj.option('urlfile');
    }
    else {
        urlfile = "";
    }

    if (this.gruntObj.file.isFile(urlfile)) {
        var file = this.gruntObj.file.read(urlfile);
        var filePath = path.dirname(urlfile) + "\\";
        var data = JSON.parse(file);

        for (var i = 0; i < data.length; i++)
        {
            var current = data[i];
            
            if (current.preScriptFile && current.preScriptFile != "")
                current.preScriptFile = filePath + current.preScriptFile;
            
            urls.push(current);
        }
    }
    else if (this.gruntObj.option('urls')) {
        var delimiter = ",";

        if (this.gruntObj.option('urls').indexOf(";") > 1)
            delimiter = ";";

        var arrUrls = this.gruntObj.option('urls').split(delimiter);

        for (var i = 0; i < arrUrls.length; i++)
        {
            var url = arrUrls[i].trim();
            urls.push({
                url: url
            });
        }
    }

    if (this.gruntObj.option('tags')) {
        options.tags = this.gruntObj.option('tags').split(',');
    }

    config.options = options;
    config.urls = urls;

    return config;
}

module.exports = GruntConfiguration;