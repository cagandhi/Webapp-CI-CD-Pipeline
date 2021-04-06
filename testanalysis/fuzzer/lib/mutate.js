function mutateString (mutator, line) {
    // Using 50% probabilitiy for each fuzzing operation, thus, a random subset of all fuzzing operations.

    // swap "==" with "!="
    if( mutator.random().bool(0.5) )
    {
        line.replace(/(!=|==)/g, function($1) { return $1 === '!=' ? '==' : '!=' })
    }
    
    // swap 0 with 1
    if( mutator.random().bool(0.5) )
    {
        line.replace(/(0|1)/g, function($1) { return $1 === '1' ? '0' : '1' })
    }
    
    // change content of "strings" in code
    if( mutator.random().bool(0.5) )
    {
        // repace content of "strings" with random string
        words = line.split(' ')
        for(var i = 0; i< words.length;i++){
            word_len = words[i].length
            if(words[i][0] == '"' && words[i][word_len-1] == '"'){
                randnum = mutator.random().integer(0,100)
                words[i] = mutator.random().string(randnum)
            }
        }
        line = words.join(' ')
    }
    
    // swap "<" with ">". Be mindful of potential impact on generics.

    if( mutator.random().bool(0.5) )
    {
        line.replace(/(<|>)/g, function($1) { return $1 === '<' ? '>' : '<' })
    }
    
    // 2 more mutation operations of your choice.

    // mutation 1  (replace a number with another random number)
    if( mutator.random().bool(0.5) )
    {
        words = line.split(' ')
        for(var i = 0; i< words.length;i++){
            
            if(!isNaN(words[i])){                               // if it is a valid number
                randnum = mutator.random().integer(0,100)
                words[i] = mutator.random().string(randnum)
            }
        }

        line = words.join(' ')
    }

    // mutation 2 (swap 'true' with 'false')
    if( mutator.random().bool(0.5) )
    {
        line.replace(/(true|false)/g, function($1) { return $1 === 'true' ? 'false' : 'true' })
    }

    return line;   
}

exports.mutateString = mutateString;