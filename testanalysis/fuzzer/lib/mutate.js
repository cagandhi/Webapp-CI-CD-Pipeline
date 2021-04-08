function mutateString (mutator, line) {
    // Using 90% probabilitiy for each fuzzing operation, thus, a random subset of all fuzzing operations.
    
    // swap "==" with "!="
    if( mutator.random().bool(0.5) )
    {
        line = line.replace(/(!=|==)/g, function($1) { return $1 === '!=' ? '==' : '!=' })
    }

    // swap 0 with 1
    if( mutator.random().bool(0.5) )
    {
        line = line.replace(/(0|1)/g, function($1) { return $1 === '1' ? '0' : '1' })
    }

    // change content of "strings" in code
    if( mutator.random().bool(0.5) )
    {        
        let randnum = mutator.random().integer(1,10);
        let random_string = '"' + mutator.random().string(randnum) + '"';
        var regex = /\"[^\"]*\"/g
        line = line.replace(regex, random_string);
    }

    // swap "<" with ">". Be mindful of potential impact on generics.

    if( mutator.random().bool(0.5) )
    {
        line = line.replace(/(<|>)/g, function($1) { return $1 === '<' ? '>' : '<' })
    }

    // 2 more mutation operations of your choice.

    // mutation 1  (replace a number with another random number)
    if( mutator.random().bool(0.5) )
    {
        let randnum_number = mutator.random().integer(-50,50).toString()
        line = line.replace(/\d+/g, randnum_number)
    }

    // mutation 2 (swap 'true' with 'false')
    if( mutator.random().bool(0.5) )
    {
        line = line.replace(/(true|false)/g, function($1) { return $1 === 'true' ? 'false' : 'true' })
    }

    return line;
}

exports.mutateString = mutateString;