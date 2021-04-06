const mtfuzz = require('./lib/driver').mtfuzz;
const fs = require('fs');
const chalk = require('chalk');
const path = require("path");

// Code under test...
// const marqdown = require('./test/marqdown');

// Seed inputs
// let mdA = fs.readFileSync('test/test.md','utf-8');
// let mdB = fs.readFileSync('test/simple.md','utf-8');

let args = process.argv.slice(2);
const runs = args.length > 0 ? args[0] : 1000;

// let directory_name = "site";
let directory_name = path.join(path.sep, 'home', 'vagrant', 'iTrust2-v8','iTrust2', 'src', 'main', 'java', 'edu', 'ncsu', 'csc', 'iTrust2');
console.log(chalk.cyan(`Directory path: ${directory_name}`));

let filePathsArr = [];
findFilesInDir(directory_name, filePathsArr);

console.log(filePathsArr);

// Fuzz function 1000 (or given) times, with given seed string inputs.
// mtfuzz(runs, filePathsArr);

// function to generate an array of file paths
function findFilesInDir(directory_path, filePathsArr)
{
    let filenames = fs.readdirSync(directory_path);
    filenames.forEach((file) => {
        let file_path = path.join(directory_path, file);

        if( fs.lstatSync(file_path).isDirectory() )
        {
            findFilesInDir(file_path, filePathsArr);
        }
        else
        {
            if( file_path.split('.').pop() == 'java' )
            {
                filePathsArr.push(file_path);
            }
        }
    });
}