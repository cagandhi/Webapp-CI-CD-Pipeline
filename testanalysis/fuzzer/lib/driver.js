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

        if (ele == '' || ele == null || ele == '{' || ele == '}' || ele.startsWith('//') || ele.startsWith('/**') || ele.startsWith('*') || ele.startsWith('import') || ele.startsWith('package')) { // ele.startsWith('@')||
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
    // console.log("FILE LIST in getTestReports()");
    // console.log(filelist);

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
        // console.log(chalk.cyan(i));
        // console.log(testcase);

        tests.push({
        name:   testcase['$'].classname+"."+testcase['$'].name,
        time:   testcase['$'].time,
        status: testcase.hasOwnProperty('failure') || testcase.hasOwnProperty('error') ? "failed": "passed"
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
    // console.log(items[0], items[0][1].length);
    // console.log(items[1], items[1][1].length);
    // console.log(items[2], items[2][1].length);
    items.sort(function(first, second) {
        return second[1].length - first[1].length;
    });
    // console.log('---------------\n');
    // console.log(items[0], items[0][1].length);
    // console.log(items[1], items[1][1].length);
    // console.log(items[2], items[2][1].length);
    var sorted_obj={};
    for (let index = 0; index < items.length; index++) {
        let element = items[index];
        let key = element[0];
        let value = element[1];
        sorted_obj[key]=value;
        
    }
    
    return(sorted_obj)
}


async function mtfuzz(iterations, seeds)
{
    var failedTests = [];
    var passedTests = 0;

    mutater.seed(0);

    console.log(chalk.green(`Fuzzing with ${iterations} randomly generated-inputs.`))

    let skip_finally_flag = false;
    var test_dict = {};


    let max_attempts = 5;
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
            let mutated_line = mutater.str(file_lines[randomLine_index]);
            // console.log("printing lines after await call");
            // console.log(file_lines[randomLine_index]);
            // console.log(mutated_line);
            if(mutated_line == file_lines[randomLine_index]){
                // console.log(chalk.cyan('reducing j by 1'));
                j--;
            }
            // else
            // {
            //     console.log("printing lines");
            // console.log(file_lines[randomLine_index]);
            // console.log(mutated_line);

            // }
            
            file_lines[randomLine_index] = mutated_line
            valid_indexes.delete(randomLine_index)
            if(valid_indexes.size == 0){
                break;
            }

        }
        // create mutated file
        mutated_file = file_lines.join('\n')
        console.log(chalk.yellow(`value of i: ${i}`));

        let mutations_fold = '.mutations';
        let mutations_dir = '/bakerx/testanalysis/fuzzer/'+mutations_fold;
        
        if( !fs.existsSync(mutations_dir) ) {
            console.log(chalk.cyan(`Created new mutations dir at ${mutations_dir}`));
            fs.mkdirSync(mutations_dir);
        }
        
        mutated_path = path.join(mutations_dir, i.toString());
        if( !fs.existsSync(mutated_path) ) {
            console.log(chalk.cyan(`Created new iterations dir at ${mutated_path}`));
            fs.mkdirSync(mutated_path);
        }

        // write mutated file to mutations dir
        var filename = path.parse(seeds[idx]).base;
        fs.writeFileSync(path.join( mutated_path, filename), mutated_file);

        console.log("\nWROTE "+filename+" IN "+mutated_path);
        var testsuite_dir = path.join(path.sep, 'home', 'vagrant', 'iTrust2-v8', 'iTrust2');

        // run given function under test with input
        try
        {
            console.log("printing src and dest paths");
            // console.log(chalk.blue(path.join( mutated_path, filename)));
            // console.log(chalk.blue(seeds[idx]));
            // replace original file by mutated file in itrust repo
            await fs.copyFile(path.join( mutated_path, filename), seeds[idx],(err) => {
                if (err) throw err;
            });
            // if( file != mutated_file )
            //     process.exit(1);

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
                console.log(chalk.cyan("Compilation Error faced"));

                try {
                    // replace original code file at the original itrust repo
                    fs.writeFileSync(seeds[idx], file);

                    // remove failed mutation file from mutations dir
                    fs.unlinkSync(path.join( mutated_path, filename));
                  } catch(err) {
                    console.error(err)
                  }

                if(max_attempts > 0){ // attempt at max 5 times
                    i--;
                    max_attempts--;
                }
                else{
                    max_attempts = 5
                }
                skip_finally_flag = true;
                continue;
            }
        }
        finally
        {
            // when mvn test has run, even if build failure, write the original file back into itrust repo
            // fs.writeFileSync(seeds[idx], file);

            // this flag will be true when compilation error. When compilation error, don't execute anything in finally block
            if( !skip_finally_flag )
            {
                console.log('in finally block');
                console.log(chalk.blue(seeds[idx]));

                console.log(chalk.cyan(`ITERATION ${i}`));
                // parse test report here
                let filelist = await getTestReports(testsuite_dir);

                // console.log("outside filelist for loop");

                // generate report dictionary here
                // filelist.forEach(async file => {
                //     let tests = await getTestResults(file);
                //     console.log(chalk.cyan("in filelist for loop"));
                //     console.log(chalk.yellow(`${file}`));

                //     tests.forEach(e => {
                //         let test_name = e.name;
                //         let test_time = e.time;
                //         let test_status = e.status;

                //         // if test name exists in dictionary, append (time, status) array to the value array
                //         if( test_name in test_dict )
                //         {
                //             if( test_status == 'failed' )
                //                 test_dict[name].push([test_time, path.join( mutated_path, filename)]);
                //         }
                //         else
                //         {
                //             test_dict[test_name] = [[test_time, path.join( mutated_path, filename)]];
                //         }

                //         console.log(chalk.yellow(`${test_name}\t${test_time}\t${test_status}`));
                //     });
                // });

                for (var k = 0; k < filelist.length; k++) {
                    let file = filelist[k];

                    let tests = await getTestResults(file);
                    // console.log(chalk.cyan("in filelist for loop"));
                    // console.log(chalk.yellow(`${file}`));
                    // console.log(tests);

                    tests.forEach(e => {
                        let test_name = e.name;
                        let test_time = e.time;
                        let test_status = e.status;

                        // store stats only when test is failed
                        if( test_status == 'failed' )
                        {
                            // path.join(mutations_fold, i.toString(), filename)

                            // if test name exists in dictionary, append (time, status) array to the value array
                            if( test_name in test_dict )
                                test_dict[test_name].push([test_time, path.join(mutations_fold, i.toString(), filename)]);
                                // test_dict[test_name].push([test_time, path.join( mutated_path, filename)]);
                            // else create a new 2d list with the first element
                            else
                                test_dict[test_name] = [[test_time, path.join(mutations_fold, i.toString(), filename)]];
                                // test_dict[test_name] = [[test_time, path.join( mutated_path, filename)]];
                        }

                        // console.log(chalk.yellow(`\n${test_name}\t${test_time}\t${test_status}`));
                    });
                }

                fs.writeFileSync(seeds[idx], file);
            }
        }
    }
    try
    {
        console.log(chalk.yellow("PRINTING TEST DICT"));
        console.log(test_dict);

        // sort the dictionary
        var sorted_dict = sort_object(test_dict);
        var hashset = new Set();

        for( var key in sorted_dict)
        {
            var value = sorted_dict[key];
            for (let index = 0; index < value.length; index++) {
                const element = value[index];
                hashset.add(element[1]);
            }
        }

        let mutation_per = (hashset.size*100)/iterations;
        console.log(chalk.yellow(`\n\nOverall mutation coverage: ${hashset.size}/${iterations} (${mutation_per}%) mutations caught by the test suite`));
        
        console.log(chalk.yellow("\nUseful tests\n============"));
        for( var key in sorted_dict)
        {
            var value = sorted_dict[key];
            // console.log(key, value);
            console.log("\n"+value.length+"/"+iterations+"  "+key);

            for (let index = 0; index < value.length; index++) {
                const element = value[index];
                console.log("\t- "+element[1]);
            }
        }
    }
    catch(e)
    {
        console.log(e);
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