const fs = require('fs');
const path = require('path');
const Random = require('random-js');
const chalk = require('chalk');
const mutateStr = require('./mutate').mutateString;

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

function remove_comments(s_split) {
    // remove "// this is a comment" kind of comments
    // for punctuation list, see https://remarkablemark.org/blog/2019/09/28/javascript-remove-punctuation/
    var regex_comm1 = /^\/\/[\s]*[\d\w\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]*/g

    // for multi line comments which are like
    // /*
    // * comm1
    // * comm2
    // */
    var regex_comm2 = /^\*[\d\w\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]*/g
    var regex_comm3 = /\/\*[\d\w\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]*/g
    var regex_comm4 = /[\d\w\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]*\*\/$/g

    for (var i = 0; i < s_split.length; i++) {
        s_split[i] = s_split[i].replace(regex_comm1, '').trim();
        s_split[i] = s_split[i].replace(regex_comm2, '').trim();
        s_split[i] = s_split[i].replace(regex_comm3, '').trim();
        s_split[i] = s_split[i].replace(regex_comm4, '').trim();
    }

    return s_split;
}

function get_valid_index_set(s_split_filter) {
    // for each line in s_split_ array, store valid index in index_array
    // valid index array does not include index of lines such as:
    // 1. decorator lines @Override, etc.
    // 2. import and package statements
    // 3. bracket lines

    var regex_at_lines = /^@[\d\w\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]*/g
    var regex_import_package = /^(import|package)[\d\w\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]*/g
    
    var valid_index_set = new Set();
    for (var i = 0; i < s_split_filter.length; i++) {
        var ele = s_split_filter[i].trim();

        console.log("\n----");
        console.log(ele);
        console.log(regex_at_lines.test(ele) || regex_import_package.test(ele));
        // console.log(regex_import_package.test(ele));
        // ignore @ lines, package and import statements and open and close brackets
        if ( regex_at_lines.test(ele) || regex_import_package.test(ele) || ele == '{' || ele == '}' ) {
            // continue;
        }
        else
        {
            console.log(i);
            valid_index_set.add(i);
        }
    }
    console.log(valid_index_set);
    return valid_index_set;
}


function remove_at_imp_pkg(s_split_filter) {
    var regex_at_lines = /^@[\d\w\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]*/g
    var regex_import_package = /^(import|package)[\d\w\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]*/g
    
    for (var i = 0; i < s_split_filter.length; i++) {
        s_split_filter[i] = s_split_filter[i].replace(regex_at_lines, '').trim();
        s_split_filter[i] = s_split_filter[i].replace(regex_import_package, '').trim();
    }

    return s_split_filter;
}


function mtfuzz(iterations, seeds, testFn)
{
    var failedTests = [];
    var passedTests = 0;

    mutater.seed(0);

    console.log(chalk.green(`Fuzzing '${testFn}' with ${iterations} randomly generated-inputs.`))

    for (var i = 1; i <= iterations; i++) {

        // Toggle between seed filepaths
        let idx = ((i % seeds.length) + seeds.length) % seeds.length;

        console.log(chalk.yellow(`${seeds[idx]}`));
        // --- apply random mutation to seed file content ---
        // read file contents as string
        let s = fs.readFileSync(seeds[ idx ], 'utf-8');

        // split file content by newline and strip start and end spaces for each line in file
        let s_split = s.split("\n");

        for (var i = 0; i < s_split.length; i++) {
            s_split[i] = s_split[i].trim();
        }
        
        console.log("BEFORE REMOVING COMMENTS");
        console.log(s_split);
        
        // call remove_comments to filter out comment lines from the filelines array
        s_split = remove_comments(s_split);

        // ----- testing start ----
        // s_split = remove_at_imp_pkg(s_split);
        // ----- testing end ----

        // remove undefined or empty string from s_split list, see https://stackoverflow.com/a/281335
        var s_split_filter = s_split.filter(function(e) {
            return (e != '' && e != null);
        });
        
        
        console.log("AFTER REMOVING COMMENTS AND FILTERING EMPTY LINES");
        console.log(s_split_filter);
        

        // create a set of valid index on which mutation operations will be run
        var valid_index_set = get_valid_index_set(s_split_filter);

        console.log("PRINTING VALID INDEX SET");
        console.log(valid_index_set);
        break;
        // RUN MUTATION OPERATIONS ON LINES PRESENT IN VALID INDEX SET

        // // apply fuzzing operations on the original file
        // let mutuatedString = mutater.str(s);

        // if( !fs.existsSync('.mutations') )
        // {
        //     fs.mkdirSync('.mutations');
        // }
        // fs.writeFileSync(path.join( '.mutations', `${i}.txt`), mutuatedString);

        // // run given function under test with input
        // try
        // {
        //     testFn(mutuatedString);
        //     passedTests++;
        // }
        // catch(e)
        // {
        //     failedTests.push( {input:mutuatedString, stack: e.stack, id: i} );
        // }
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