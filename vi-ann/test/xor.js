import * as ViAnn from '../vi-ann';

let stepFunction = function(stepValue)
{
    return function(input)
    {
        return input >= stepValue ? 1 : 0;
    }
}

let hiddenLayer = new ViAnn.Feedforward.Layer([0, 0], [1, -1, -1, 1], stepFunction(1));
let outputLayer = new ViAnn.Feedforward.Layer([0], [1, 1], stepFunction(1));
let network     = new ViAnn.Feedforward.Network([hiddenLayer, outputLayer]);

console.log('a=0 b=0 c=' + network.evaluate([0, 0]));
console.log('a=0 b=1 c=' + network.evaluate([0, 1]));
console.log('a=1 b=0 c=' + network.evaluate([1, 0]));
console.log('a=1 b=1 c=' + network.evaluate([1, 1]));

