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

// refer https://stackoverflow.com/a/53530097/6543250
function sort_object(obj) {
    items = Object.keys(obj).map(function(key) {
        return [key, obj[key]];
    });

    items.sort(function(first, second) {
        return second[1].length - first[1].length;
    });

    sorted_obj={}
    $.each(items, function(k, v) {
        use_key = v[0]
        use_value = v[1]
        sorted_obj[use_key] = use_value
    })
    return sorted_obj
}


async function mtfuzz(iterations, seeds)
{
    var failedTests = [];
    var passedTests = 0;

    mutater.seed(0);

    console.log(chalk.green(`Fuzzing with ${iterations} randomly generated-inputs.`))

    let skip_finally_flag = false;
    for (var i = 1; i <= iterations; i++) {

        skip_finally_flag = false;

        // choose a random index
        // let idx = ((i % seeds.length) + seeds.length) % seeds.length;
        let idx = Math.floor(Math.random() * seeds.length)
        console.log(chalk.yellow(`${seeds[idx]}`));

        // read original file contents as string
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
        // create mutated file
        mutated_file = file_lines.join('\n')
        console.log(chalk.yellow(`value of i: ${i}`));

        mutated_path = path.join('.mutations', i.toString());
        if( !fs.existsSync(mutated_path) ) {
            fs.mkdirSync(mutated_path);
        }

        // write mutated file to mutations dir
        var filename = path.parse(seeds[idx]).base;
        fs.writeFileSync(path.join( mutated_path, filename), mutated_file);

        var testsuite_dir = path.join(path.sep, 'home', 'vagrant', 'iTrust2-v8', 'iTrust2');

        // run given function under test with input
        try
        {
            // replace original file by mutated file in itrust repo
            fs.copyFile(path.join( mutated_path, filename), seeds[idx],(err) => {
                if (err) throw err;
            });

            console.log(chalk.yellow(`Testsuite dir: ${testsuite_dir}`));
            console.log(chalk.yellow(`Running mvn clean test....`));
            await child.execSync('sudo mvn clean test', {cwd: testsuite_dir, stdio: ['ignore', 'ignore', 'ignore']});
            // passedTests++;
            console.log(chalk.yellow('After mvn test run'));
        }
        catch(e)
        {
            // check for compilation error
            if( !fs.existsSync( path.join(testsuite_dir, 'target', 'surefire-reports') ) )
            {
                i--;
                skip_finally_flag = true;
                continue;
            }
            // else, build failure. continue finally block execution bcoz test.xml is generated
            // else
            // {
            //     failedTests.push( {input:mutuatedString, stack: e.stack, id: i} );
            // }
        }
        finally
        {
            // this flag will be true when compilation error. When compilation error, don't execute anything in finally block
            if( !skip_finally_flag )
            {
                // when mvn test has run, even if build failure, write the original file back into itrust repo
                fs.writeFileSync(seeds[idx], file);

                console.log('in finally block');
                console.log(chalk.cyan(`ITERATION ${i}`));
                // parse test report here
                let filelist = getTestReports(testsuite_dir);

                // generate report dictionary here
                var test_dict = {};
                filelist.forEach(async file => {
                    let tests = await getTestResults(file);
                    console.log(chalk.yellow(`${file}`));

                    tests.forEach(e => {
                        let test_name = e.name;
                        let test_time = e.time;
                        let test_status = e.status;

                        // if test name exists in dictionary, append (time, status) array to the value array
                        if( test_name in test_dict )
                        {
                            if( e.status == 'failed' )
                                test_dict[name].push([e.time, path.join( mutated_path, filename)]);
                        }
                        else
                        {
                            test_dict[test_name] = [[e.time, path.join( mutated_path, filename)]];
                        }

                        // console.log(e);
                    });
                });

                console.log(chalk.yellow("Useful tests\n============"));
                // sort the dictionary
                var sorted_dict = sort_object(test_dict);
                for( var key in sorted_dict)
                {
                    var value = sorted_dict[key];

                    console.log("\n"+value.length+"/"+iterations+"  "+key);
                    for( var x in value )
                    {
                        console.log("\n\t- "+value[1]);
                    }
                    console.log("\n");
                }
            }
        }
    }
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