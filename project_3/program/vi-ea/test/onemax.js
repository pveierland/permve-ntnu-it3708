import * as vi_ea from '../src/vi-ea';

let fitness_function = {
    evaluate: function(phenotype)
    {
        return phenotype.reduce((sum, element) => sum += element, 0) / phenotype.length;
    }
};

let system = new vi_ea.System(
    new vi_ea.fixed_bit_vector.Creator(10),
    new vi_ea.parent_selection.FitnessProportionate(),
    new vi_ea.adult_selection.FullGenerationalReplacement(),
    new vi_ea.reproduction.Sexual(
        new vi_ea.fixed_bit_vector.Crossover(1),
        new vi_ea.fixed_bit_vector.Mutator(0.005)),
    fitness_function,
    5);

for (let generation = 0; generation <= 1000; generation += 1)
{
    const best_individual = system.best_individual();
    console.log(`generation = ${generation} best = ${best_individual.fitness} -> ${best_individual.genotype}`);
    system.evolve();
}

//let creator = new vi_ea.fixed_bit_vector.Creator(5);
//let mutator = new vi_ea.fixed_bit_vector.Mutator(0.2);

//let creator = new vi.ea.fixed_bit_vector.Creator(5);
//let mutator = new vi.ea.fixed_bit_vector.Mutator(0.2);
//let crossover = new vi.ea.fixed_bit_vector.Crossover(1);

//let x = creator.create();
//mutator.apply(x);

//let fitness_proportionate = new vi_ea.parent_selection.FitnessProportionate();
//
//let population = [ { fitness: 10, genotype: 'A' }, { fitness: 5, genotype: 'B' }, { fitness: 1, genotype: 'C' } ];
//
//let artifacts = fitness_proportionate.prepare(population);
//
//let counts = { 'A': 0, 'B': 0, 'C': 0 };
//
//for (let i = 0; i != 1000; i += 1)
//{
//    let selected = fitness_proportionate.select(population, artifacts);
//    counts[selected.genotype] += 1;
//}
//
//console.log(counts);
//
