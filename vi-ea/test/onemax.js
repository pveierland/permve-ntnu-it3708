import * as ea from '../vi-ea';

let system = new ea.System(
{
    populationSize:            200,
    elitismCount:              2,
    genotypeCreationStrategy:  new ea.fixedBitVector.Creator(100),
    parentSelectionStrategy:   new ea.parentSelection.Sigma(),
    adultSelectionStrategy:    new ea.adultSelection.FullGenerationalReplacement(),
    reproductionStrategy:      new ea.reproduction.Sexual(
        new ea.fixedBitVector.Crossover(1),
        new ea.fixedBitVector.Mutator(0.005)),
    fitnessEvaluationStrategy:
    {
        evaluate: phenotype =>
        {
            return phenotype.reduce((sum, element) => sum += element, 0) / phenotype.length;
        }
    }
});

for (let generation = 0; generation <= 1000; generation += 1)
{
    const stats = system.stats();
    console.log(`generation = ${generation} mean = ${stats.fitnessMean} std = ${stats.fitnessPStdDev} best = ${stats.bestIndividual.fitness} -> ${stats.bestIndividual.genotype}`);
    system.evolve();
}

