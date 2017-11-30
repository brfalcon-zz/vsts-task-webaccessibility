var currentpath = process.cwd();
process.chdir(__dirname);

var AxeRunner = require("./axeTaskRunner.js");
var runner = new AxeRunner();
runner.run();

process.chdir(currentpath);