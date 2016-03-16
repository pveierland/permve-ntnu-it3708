let vi = require('../lib/vi.js');

let creator = new vi.ea.fixed_bit_vector.Creator(5);

let x = creator.create();
console.log(x);

let mutator = new vi.ea.fixed_bit_vector.Mutator(0.2);

mutator.apply(x);
console.log(x);

