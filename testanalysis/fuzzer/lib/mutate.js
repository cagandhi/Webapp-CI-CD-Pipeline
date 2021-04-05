// function mutateString (mutator, val) {

//     // Step 3. Replace single quotes strings with integers
//     if( mutator.random().bool(0.5) )
//     {
//         randnum = mutator.random().integer(0,100)
//         val = val.replace(/'\w+'/g, randnum)
        
//     }

//     var array = val.split('');
//     // array.reverse();
//     do{
//         if( mutator.random().bool(0.25) )
//         {
//             // Step 1. Randomly remove a random set of characters, from a random start position.
//             // console.log(array.length);
//             random_start_position = mutator.random().integer(0,array.length-1);
//             random_delete_count = mutator.random().integer(0, array.length-random_start_position);
//             array.splice(random_start_position, random_delete_count);
//         }
//         if( mutator.random().bool(0.25) )
//         {
//             // Step 2. Randomly add a set of characters.
//             random_start_position = mutator.random().integer(0,array.length-1);
//             random_characters = mutator.random().string(10);
//             array.splice( random_start_position, 0, ...random_characters);

//         }
//     } while(mutator.random().bool(0.25));

//     return array.join('');
// }

// exports.mutateString = mutateString;


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
        //placeholder
        
    }
    
    // swap "<" with ">". Be mindful of potential impact on generics.

    if( mutator.random().bool(0.5) )
    {
        line.replace(/(<|>)/g, function($1) { return $1 === '<' ? '>' : '<' })
    }
    
    // 2 more mutation operations of your choice.

    // mutation 1  (replace a number with random numer)
    if( mutator.random().bool(0.5) )
    {
        // placeholder
    }

    // mutation 2 (swap 'true' with 'false')
    if( mutator.random().bool(0.5) )
    {
        line.replace(/(true|false)/g, function($1) { return $1 === 'true' ? 'false' : 'true' })
    }
    
}

exports.mutateString = mutateString;