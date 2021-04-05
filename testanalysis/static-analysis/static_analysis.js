const esprima = require("esprima");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');
const path = require("path");

const LOC_threshold = 100;
const MessageChain_threshold = 10;
const NestingDepth_threshold = 5;

function findFilesInDir(directory_path, filePathsArr)
{
    let filenames = fs.readdirSync(directory_path);
    filenames.forEach((file) => {
        let file_path = path.join(directory_path, file);

        if( file != 'node_modules')
        {
            if( fs.lstatSync(file_path).isDirectory() )
            {
                findFilesInDir(file_path, filePathsArr);
            }
            else
            {
                if( file_path.split('.').pop() == 'js' )
                {
                    filePathsArr.push(file_path);
                }
            }
        }
    });
}

function main()
{
    console.log( chalk.yellow("\nPopulating list of files to analyse..."));

    // let directory_name = "site";
    let directory_name = path.join(path.sep, 'var', 'lib', 'jenkins', 'workspace', 'checkbox.io', 'server-side');
    console.log(chalk.cyan(`Directory path: ${directory_name}`));

    let filePathsArr = [];
    findFilesInDir(directory_name, filePathsArr);

    console.log(filePathsArr);

    console.log( chalk.yellow("\nRunning static analysis..."));
    var builders = {};
    filePathsArr.forEach((filePath) => {
        complexity(filePath, builders);
    });

    console.log( chalk.yellow("\nPrinting static analysis reports..."));


    let fail_flag = false;
    // Report
    for( var node in builders )
    {
        var builder = builders[node];
        builder.report();

        if( builder.Length > LOC_threshold )
        {
            fail_flag = true;
            console.log(chalk.bgRed(`\nFunction length exceeds ${LOC_threshold} LOC. Build will be FAILED!!`));
        }
        if( builder.MaxChainCount > MessageChain_threshold )
        {
            fail_flag = true;
            console.log(chalk.bgRed(`\nMessage chain greater than ${MessageChain_threshold} detected. Build will be FAILED!!`));
        }
        if( builder.MaxNestingDepth > NestingDepth_threshold )
        {
            fail_flag = true;
            console.log(chalk.bgRed(`\nNesting depth greater than ${NestingDepth_threshold} detected. Build will be FAILED!!`));
        }
    }

    if( fail_flag )
        process.exit(1);
}



function complexity(filePath, builders)
{
    var buf = fs.readFileSync(filePath, "utf8");
    var ast = esprima.parse(buf, options);

    var i = 0;

    // Initialize builder for file-level information
    var fileBuilder = new FileBuilder();
    fileBuilder.FileName = filePath;
    builders[filePath] = fileBuilder;

    // Traverse program with a function visitor.
    traverseWithParents(ast, function (node)
    {
        if (node.type === 'FunctionDeclaration')
        {
            var builder = new FunctionBuilder();

            builder.FunctionName = functionName(node);
            builder.StartLine    = node.loc.start.line;

            // Calculate function level properties.
            builder.ParameterCount = node.params.length;

            // 1. Method Length
            builder.Length = node.loc.end.line - node.loc.start.line;

            // 2. Max Chain calculation
            traverseWithParents(node, function (child)
            {
                if( child.type == "MemberExpression" )
                {
                    let chainCnt = 0;
                    traverseWithParents(child, function (child1)
                    {
                        if( child1.type == "MemberExpression" )
                        {
                            chainCnt++;
                        }
                    });
                    builder.MaxChainCount = Math.max(builder.MaxChainCount, chainCnt)
                }
            });

            // 3. max nesting depth
            var maxDepth = 0;
            traverseWithParents(node, function (child)
            {
                if ( childrenLength(child) == 0  )
                {
                    let depth=0;
                    let n=child;
                    while( n.type != "FunctionDeclaration" )
                    {
                        if( isDecision(n) && n.parent.alternate == null )
                        {
                            depth++;
                        }
                        n = n.parent;
                    }

                    builder.MaxNestingDepth = Math.max(depth, builder.MaxNestingDepth);
                }
            });

            builders[builder.FunctionName] = builder;
        }

    });

}

// Represent a reusable "class" following the Builder pattern.
class FunctionBuilder
{
    constructor() {
        this.StartLine = 0;
        this.FunctionName = "";
        // The number of parameters for functions
        this.ParameterCount  = 0;
        // The number of lines.
        this.Length = 0;
        // The max depth of scopes (nested ifs, loops, etc)
        this.MaxNestingDepth = 0;
        // The max count of chains
        this.MaxChainCount = 0;

        // initialise new variables to store colour information so original variables can be used to check against thresholds
        this.LengthColour = this.Length;
        this.MaxNestingDepthColour = this.MaxNestingDepth;
        this.MaxChainCountColour = this.MaxChainCount;
        this.ParameterCountColour = this.ParameterCount;
    }

    threshold() {

        const thresholds = {
            MaxNestingDepth: [{t: NestingDepth_threshold, color: 'red'}, {t: 3, color: 'yellow'}],
            MaxChainCount: [{t: MessageChain_threshold, color: 'red'}, {t: 5, color: 'yellow'}],
            Length: [{t: LOC_threshold, color: 'red'}, {t: 10, color: 'yellow'}],
            ParameterCount: [{t: 10, color: 'red'}, {t: 3, color: 'yellow'}]
        }

        const showScore = (id, value) => {
            let scores = thresholds[id];
            const lowestThreshold = {t: 0, color: 'green'};
            const score = scores.sort( (a,b) => {a.t - b.t}).find(score => score.t <= value) || lowestThreshold;
            return score.color;
        };

        this.ParameterCountColour = chalk`{${showScore('ParameterCount', this.ParameterCount)} ${this.ParameterCount}}`;
        this.LengthColour = chalk`{${showScore('Length', this.Length)} ${this.Length}}`;
        this.MaxChainCountColour = chalk`{${showScore('MaxChainCount', this.MaxChainCount)} ${this.MaxChainCount}}`;
        this.MaxNestingDepthColour = chalk`{${showScore('MaxNestingDepth', this.MaxNestingDepth)} ${this.MaxNestingDepth}}`;

    }

    report()
    {
        this.threshold();

        console.log(
chalk`\n{cyan.underline ${this.FunctionName}}(): at line #${this.StartLine}
\nParameters: ${this.ParameterCountColour}\tLength: ${this.LengthColour}
MaxDepth: ${this.MaxNestingDepthColour}\tMaxChainCount: ${this.MaxChainCountColour}`
);
    }
};

// A builder for storing file level information.
function FileBuilder()
{
    this.FileName = "";

    this.report = function()
    {
        console.log(chalk.yellow("\n************************"));
        console.log (
            chalk`{magenta.underline ${this.FileName}}
`);

    }
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent')
            {
                child.parent = object;
                traverseWithParents(child, visitor);
            }
        }
    }
}

// Helper function for counting children of node.
function childrenLength(node)
{
    var key, child;
    var count = 0;
    for (key in node)
    {
        if (node.hasOwnProperty(key))
        {
            child = node[key];
            if (typeof child === 'object' && child !== null && key != 'parent')
            {
                count++;
            }
        }
    }
    return count;
}


// Helper function for checking if a node is a "decision type node"
function isDecision(node)
{
    if( node.type == 'IfStatement' || node.type == 'ForStatement' || node.type == 'WhileStatement' ||
         node.type == 'ForInStatement' || node.type == 'DoWhileStatement')
    {
        return true;
    }
    return false;
}

// Helper function for printing out function name.
function functionName( node )
{
    if( node.id )
    {
        return node.id.name;
    }
    return "anon function @" + node.loc.start.line;
}

main();
exports.main = main;