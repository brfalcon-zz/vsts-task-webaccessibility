const path = require('path');
const tl = require('vsts-task-lib/task');
var fs = require('fs');

function AxeTaskRunner(reportFileName) {
    this.vstsTask = tl;
    this.reportFileName = reportFileName;
    this.config = this.parseConfiguration();
    this.grunt = this.getGruntInstance();
    this.setGruntArgs(this.grunt, this.config.analysis);
}

AxeTaskRunner.prototype.getGruntInstance = function () {
    var gt = null;
    var gruntInstance = null;
    var gruntFile = 'Gruntfile.js';

    this.vstsTask.setResourcePath(path.join(__dirname, 'task.json'));
    gt = this.vstsTask.which('grunt', false);

    if (this.vstsTask.exist(gt)) {
        gruntInstance = this.vstsTask.tool(gt);
    } else {
        gruntInstance = this.vstsTask.tool(this.vstsTask.which('node', true));

        var gtcli = this.vstsTask.getInput('gruntCli', true);
        var cwd = this.vstsTask.getPathInput('cwd', true, false);
      
        gtcli = path.resolve(cwd, gtcli);
     
        if (this.vstsTask.exist(gtcli)) {
            gruntInstance.line(gtcli);
        } else {
            this.vstsTask.setResult(this.vstsTask.TaskResult.Failed, this.vstsTask.loc('GruntCliNotInstalled', gtcli));
        }
    }

    gruntInstance.arg("--gruntfile");
    gruntInstance.line(path.join(__dirname, gruntFile));

    return gruntInstance;
}

AxeTaskRunner.prototype.parseConfiguration = function () {
    var config = {
        analysis: {
            loginurl: this.vstsTask.getInput('loginurl', false) || "",
            userControlName: this.vstsTask.getInput('userControlName', false) || "",
            passControlName: this.vstsTask.getInput('passControlName', false) || "",
            user: this.vstsTask.getInput('user', false) || "",
            pass: this.vstsTask.getInput('pass', false) || "",
            titleToWait: this.vstsTask.getInput('titleToWait', false) || "",
            continueOnViolations: this.vstsTask.getBoolInput('continueOnViolations', false) || false,
            loginButtonName: this.vstsTask.getInput('loginButtonName', false) || "",
            urls: this.vstsTask.getInput('urls', false) || '',
            urlfile: this.vstsTask.getInput('urlfile', false) || path.resolve('urlsToAnalyze/all.txt'),
            tags: this.vstsTask.getInput('tags', false) || '',
            testResultPath: this.vstsTask.getInput("testOutputFolder")
        }
    };

    return config;
}

AxeTaskRunner.prototype.parseReportFromFile = function (reportFile) {
    var absoluteFilePath = path.resolve(reportFile);
    var report = fs.readFileSync(absoluteFilePath);

    return JSON.parse(report);
}

AxeTaskRunner.prototype.setGruntArgs = function (gt, analysisConfig) {
    'use strict';
    
    if (analysisConfig.urls) {
        gt.arg("--urls");
        gt.line(analysisConfig.urls);
    }

    if (analysisConfig.urlfile && fs.lstatSync(analysisConfig.urlfile).isFile()) {
        gt.arg("--urlfile");
        gt.line(analysisConfig.urlfile);
    }

    if (analysisConfig.tags) {
        gt.arg("--tags");
        gt.line(analysisConfig.tags);
    }

    if (analysisConfig.loginurl) {
        gt.arg("--loginurl");
        gt.line(analysisConfig.loginurl);
    }

    if (analysisConfig.userControlName) {
        gt.arg("--userControlName");
        gt.line(analysisConfig.userControlName);
    }

    if (analysisConfig.passControlName) {
        gt.arg("--passControlName");
        gt.line(analysisConfig.passControlName);
    }

    if (analysisConfig.user) {
        gt.arg("--user");
        gt.line(analysisConfig.user);
    }

    if (analysisConfig.pass) {
        gt.arg("--pass");
        gt.line(analysisConfig.pass);
    }

    if (analysisConfig.titleToWait) {
        gt.arg("--titleToWait");
        gt.line(analysisConfig.titleToWait);
    }

    if (analysisConfig.loginButtonName) {
        gt.arg("--loginButtonName");
        gt.line(analysisConfig.loginButtonName);
    }

    if (analysisConfig.testResultPath) {
        gt.arg("--testResultPath");
        gt.line(analysisConfig.testResultPath);
    }

    if (analysisConfig.continueOnViolations)
        gt.arg("--force");
}

AxeTaskRunner.prototype.finishTask = function (gruntReturnCode, reportsToSave, reportsFailedSaving) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 1;
    var errorMessage = '';

    if (reportsFailedSaving.length == 0) {
        this.vstsTask.setResult(this.vstsTask.TaskResult.Succeeded, this.vstsTask.loc('GruntReturnCode', gruntReturnCode));
    } else if (reportsFailedSaving.length < reportsToSave) {
        if (reportsFailedSaving[0].body) {
            errorMessage = JSON.parse(reportsFailedSaving[0].body).message;
        } else {
            errorMessage = reportsFailedSaving[0];
        }
        this.vstsTask.setResult(this.vstsTask.TaskResult.Failed, this.vstsTask.loc('GruntFailed', `Failed to save ${reportsFailedSaving.length} reports to the database! Reason: ${errorMessage}`));
    } else {

        if (reportsFailedSaving[0].body) {
            errorMessage = JSON.parse(reportsFailedSaving[0].body).message;
        } else {
            errorMessage = reportsFailedSaving[0];
        }

        this.vstsTask.setResult(this.vstsTask.TaskResult.Failed, this.vstsTask.loc('GruntFailed', `Failed to save all reports to the database! Reason : ${errorMessage}`));
    }
}

AxeTaskRunner.prototype.run = function () {
    var axeTaskRunner = this;

    //var reportCollection = this.parseReportFromFile(this.reportFileName);

    var npm = this.vstsTask.which('npm', false);
    
    if (this.vstsTask.exist(npm)) {
        var npmInstance = this.vstsTask.tool(npm);
        npmInstance.arg('install');
        
        npmInstance
        .exec()
        .then((returnCode) =>
            axeTaskRunner.runGrunt()
        )
        .fail((error) => 
            this.vstsTask.setResult(this.vstsTask.TaskResult.Failed, this.vstsTask.loc('GruntFailed', error.message))
        );
    }
    else
    {
        this.vstsTask.setResult(this.vstsTask.TaskResult.Failed, this.vstsTask.loc('NpmNotInstalled', npmInstance));
    }
}

AxeTaskRunner.prototype.runGrunt = function() {
    this.grunt
    .exec()
    .then((gruntReturnCode) => 
        this.vstsTask.setResult(this.vstsTask.TaskResult.Succeeded, this.vstsTask.loc('GruntReturnCode', gruntReturnCode))
    )
    .fail((error) => 
        this.vstsTask.setResult(this.vstsTask.TaskResult.Failed, this.vstsTask.loc('GruntFailed', error.message))
    );
}

module.exports = AxeTaskRunner;