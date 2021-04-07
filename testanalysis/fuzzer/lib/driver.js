const fs = require('fs');
const child = require('child_process');
const path = require('path');
const Random = require('random-js');
const chalk = require('chalk');
const mutateStr = require('./mutate').mutateString;
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const Bluebird = require('bluebird');

class mutater {
    static random() {
        return mutater._random || fuzzer.seed(0)
    }

    static seed (kernel) {
        mutater._random = new Random.Random(Random.MersenneTwister19937.seed(kernel));
        return mutater._random;
    }

    static str( str )
    {
        return mutateStr(this, str);
    }

};

// function to return a set of valid indexes
function get_valid_index_set(s_split_filter) {    
    var valid_index_set = new Set();
    for (var i = 0; i < s_split_filter.length; i++) {
        var ele = s_split_filter[i].trim();

        if (ele == '' || ele == null || ele == '{' || ele == '}' || ele.startsWith('//') || ele.startsWith('/**') || ele.startsWith('*') || ele.startsWith('@')|| ele.startsWith('import') || ele.startsWith('package')) {
            // continue;
        }
        else
        {
            // console.log(i);
            valid_index_set.add(i);
        }
    }
    return valid_index_set;
}

function getTestReports(testdir) {
    // '/simplecalc/target/surefire-reports/TEST-com.github.stokito.unitTestExample.calculator.CalculatorTest.xml';
    
    let testReportBase = `${testdir}/target/surefire-reports/`;
    const files = fs.readdirSync(testReportBase);

    var filelist = files.filter(function(f) {
        return f.includes('.xml');
    });

    for (let i = 0; i < filelist.length; i++) {
        filelist[i] = testReportBase + filelist[i];
    }

    // const filename = files.find((file) => {
    //   // return the first xml file in directory
    //   return file.includes('.xml');
    // });

    // console.log( chalk.green(`Found test report ${filename}`) );
    // return testReportBase + filename;
    console.log("FILE LIST in getTestReports()");
    console.log(filelist);

    return filelist;
}

async function getTestResults(testReport)
{
    // console.log("in getTestResults");;
    var contents = fs.readFileSync(testReport)
    let xml2json = await Bluebird.fromCallback(cb => parser.parseString(contents, cb));
    let tests = readMavenXmlResults(xml2json);
    return tests;
}

function readMavenXmlResults(result)
{
    // console.log("start mavenxml");
    var tests = [];
    for( var i = 0; i < result.testsuite['$'].tests; i++ )
    {
        var testcase = result.testsuite.testcase[i];

        tests.push({
        name:   testcase['$'].name,
        time:   testcase['$'].time,
        status: testcase.hasOwnProperty('failure') ? "failed": "passed"
        });
    }

    // console.log("in mavenxml");
    // console.log(tests);
    return tests;
}

// Refer https://stackoverflow.com/questions/42739256
function getRandomItem(set) {
    let items = Array.from(set);
    return items[Math.floor(Math.random() * items.length)];
}

async function mtfuzz(iterations, seeds)
{
    var failedTests = [];
    var passedTests = 0;

    mutater.seed(0);

    console.log(chalk.green(`Fuzzing with ${iterations} randomly generated-inputs.`))

    for (var i = 1; i <= iterations; i++) {

        // choose a random index
        // let idx = ((i % seeds.length) + seeds.length) % seeds.length;
        let idx = Math.floor(Math.random() * seeds.length)
        console.log(chalk.yellow(`${seeds[idx]}`));
        
        // read file contents as string
        let file = fs.readFileSync(seeds[ idx ], 'utf-8');

        // split file content by newline and strip start and end spaces for each line in file
        let file_lines = file.split("\n");

        let valid_indexes = get_valid_index_set(file_lines);
        let ten_percent_length = Math.ceil(0.1*file_lines.length); // 4
        // Run fuzzer on 10% of file_lines

        for (var j = 0; j < ten_percent_length; j++) {
            let randomLine_index = getRandomItem(valid_indexes);
            
            // console.log(randomLine_index, file_lines[randomLine_index]);
            file_lines[randomLine_index] = mutater.str(file_lines[randomLine_index])
            valid_indexes.delete(randomLine_index)
            if(valid_indexes.size == 0){
                break;
            }

        }
        mutated_file = file_lines.join('\n')
        console.log(chalk.yellow(`value of i: ${i}`));
        if( !fs.existsSync(`.mutations/${i}/`) )
        {
            fs.mkdirSync(`.mutations/${i}/`);
        }
        var filename = path.parse(seeds[idx]).base;
        fs.writeFileSync(path.join( `.mutations/${i}/`, filename), mutated_file);        

        var testsuite_dir = path.join(path.sep, 'home', 'vagrant', 'iTrust2-v8', 'iTrust2');
        // run given function under test with input
        try
        {
            // replace original file by mutated file in itrust repo
            fs.copyFile(path.join( `.mutations/${i}/`, filename), seeds[idx],(err) => {
                if (err) throw err;
            });
            
            console.log(chalk.yellow(`Testsuite dir: ${testsuite_dir}`));
            console.log(chalk.yellow(`Running mvn clean test....`));
            await child.execSync('sudo mvn clean test', {cwd: testsuite_dir, stdio: ['ignore', 'ignore', 'ignore']});
            passedTests++;
            console.log(chalk.yellow(`After mvn test run. Passed tests count: ${passedTests}`));
        }
        catch(e)
        {
            // check for compilation error
            if( !fs.existsSync( path.join(testsuite_dir, 'target', 'surefire-reports') ) )
            {
                i--;
                continue;
            }
            // else, build failure. continue finally block execution bcoz test.xml is generated
            else
            {
                failedTests.push( {input:mutuatedString, stack: e.stack, id: i} );
            }
        }
        finally{
            console.log('in finally block');
            console.log(chalk.cyan(`ITERATION ${i}`));
            // parse test report here
            let filelist = getTestReports(testsuite_dir);

            filelist.forEach(async file => {
                let tests = await getTestResults(file);
                console.log(chalk.yellow(`${file}`));
                // console.log(tests);
                tests.forEach(e => {
                    console.log(e);
                });
            });
        }
    }

    // reduced = {};
    // // RESULTS OF FUZZING
    // for( var i =0; i < failedTests.length; i++ )
    // {
    //     var failed = failedTests[i];

    //     var trace = failed.stack.split("\n");
    //     var msg = trace[0];
    //     var at = trace[1];
    //     console.log( msg );
    //     // console.log( failed.stack );

    //     if( !reduced.hasOwnProperty( at ) )
    //     {

    //         reduced[at] = `${chalk.red(msg)}\nFailed with input: .mutations/${failed.id}.txt\n${chalk.grey(failed.stack)}`;
    //     }
    // }

    // console.log("\n" + chalk.underline(`Finished ${iterations} runs.`));
    // console.log(`passed: ${chalk.green(passedTests)}, exceptions: ${chalk.red(failedTests.length)}, faults: ${chalk.blue(Object.keys(reduced).length)}`);

    // console.log("\n" + chalk.underline("Discovered faults."));
    // console.log();
    // for( var key in reduced )
    // {
    //     console.log( reduced[key] );
    // }

}

exports.mtfuzz = mtfuzz;

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}