import * as ea from '../../vi-ea/vi-ea';
import * as flatlandEa from '../../vi-flatland-ea/vi-flatland-ea';
import * as fs from 'fs';
import * as math from 'mathjs';

function buildFitnessEvaluationStrategy(fitnessExpression, scenarios, scenarioTimeSteps)
{
    return {
        evaluate: flatlandEa.createFitnessFunction(
            math.compile(fitnessExpression), scenarios, scenarioTimeSteps)
    }
}

function buildScenarios(scenarioCount, worldModelOptions)
{
    return Array.from({length: scenarioCount}).map(
        function() { return flatlandEa.generateRandomWorld(worldModelOptions); });
}


function runPerformanceTest(options, scenarioGeneration, scenarioCount, scenarioTimeSteps)
{
    let scenarios                 = buildScenarios(scenarioCount, options.worldModel);
    let fitnessEvaluationStrategy = buildFitnessEvaluationStrategy(options.ea.fitnessExpression, scenarios, scenarioTimeSteps);

    let system = new ea.System(
    {
        populationSize:            options.ea.populationSize,
        elitismCount:              options.ea.elitismCount,
        genotypeCreationStrategy:  new ea.fixedBitVector.Creator(144),
        parentSelectionStrategy:   new ea.parentSelection.Tournament(
            options.ea.tournamentGroupSize, options.ea.tournamentRandomProbability),
        adultSelectionStrategy:    new ea.adultSelection.FullGenerationalReplacement(),
        reproductionStrategy:      new ea.reproduction.Sexual(
            new ea.fixedBitVector.Crossover(1),
            new ea.fixedBitVector.Mutator(options.ea.mutationRate)),
        fitnessEvaluationStrategy: fitnessEvaluationStrategy,
        developmentStrategy:
        {
            develop: flatlandEa.genotypeDevelopmentStrategy
        },
        diversityStrategy:
        {
            evaluate: ea.fixedBitVector.diversity
        }
    });

    for (let i = 0; i < options.ea.generationCount; i++)
    {
        const stats = system.stats();
        console.log(`${system.generation} ${stats.fitnessMean} ${stats.fitnessPStdDev} ${stats.bestIndividual.fitness} ${stats.diversity}`);

        if (scenarioGeneration === 'dynamic')
        {
            // When in dynamic mode; generate new world models for each generation
            scenarios                        = buildScenarios(scenarioCount, options.worldModel);
            system.fitnessEvaluationStrategy = buildFitnessEvaluationStrategy(options.ea.fitnessExpression, scenarios, scenarioTimeSteps);
        }

        system.evolve();
    }

    const stats = system.stats();
    console.log(`${system.generation} ${stats.fitnessMean} ${stats.fitnessPStdDev} ${stats.bestIndividual.fitness} ${stats.diversity}`);
}

let options =
{
    ea:
    {
        fitnessExpression:           'foodEaten - 2 * poisonEaten',
        tournamentGroupSize:         20,
        tournamentRandomProbability: 0.1,
        populationSize:              200,
        elitismCount:                5,
        mutationRate:                0.005,
        generationCount:             100
    },
    worldModel:
    {
        width:             10,
        height:            10,
        foodProbability:   1/3,
        poisonProbability: 1/3
    }
};

runPerformanceTest(options, 'static', 5, 60);

