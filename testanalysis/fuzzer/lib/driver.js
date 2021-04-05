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

function mtfuzz(iterations, seeds, testFn)
{    
    var failedTests = [];
    var passedTests = 0;

    mutater.seed(0);

    console.log(chalk.green(`Fuzzing '${testFn}' with ${iterations} randomly generated-inputs.`))
    
    for (var i = 1; i <= iterations; i++) {

        // Toggle between seed files
        let idx = ((i % seeds.length) + seeds.length) % seeds.length;

        // apply random mutation to seed input
        let s = seeds[ idx ];
        let mutuatedString = mutater.str(s);
        
        if( !fs.existsSync('.mutations') )
        {
            fs.mkdirSync('.mutations');
        }
        fs.writeFileSync(path.join( '.mutations', `${i}.txt`), mutuatedString);

        // run given function under test with input
        try
        {
            testFn(mutuatedString);
            passedTests++;
        }
        catch(e)
        {
            failedTests.push( {input:mutuatedString, stack: e.stack, id: i} );
        }
    }

    reduced = {};
    // RESULTS OF FUZZING
    for( var i =0; i < failedTests.length; i++ )
    {
        var failed = failedTests[i];

        var trace = failed.stack.split("\n");
        var msg = trace[0];
        var at = trace[1];
        console.log( msg );
        // console.log( failed.stack );

        if( !reduced.hasOwnProperty( at ) )
        {

            reduced[at] = `${chalk.red(msg)}\nFailed with input: .mutations/${failed.id}.txt\n${chalk.grey(failed.stack)}`; 
        }
    }

    console.log("\n" + chalk.underline(`Finished ${iterations} runs.`));
    console.log(`passed: ${chalk.green(passedTests)}, exceptions: ${chalk.red(failedTests.length)}, faults: ${chalk.blue(Object.keys(reduced).length)}`);
    
    console.log("\n" + chalk.underline("Discovered faults."));
    console.log();
    for( var key in reduced )
    {
        console.log( reduced[key] );
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