import * as ea from '../../vi-ea/vi-ea';
import * as flatlandApp from '../../vi-flatland-app/src/vi-flatland-app';
import * as fs from 'fs';
import * as math from 'mathjs';

export function buildScenarios(scenarioCount, worldModelOptions)
{
    return Array.from({length: scenarioCount}).map(
        function() { return flatlandApp.generateRandomWorld(worldModelOptions); });
}

export function getDefaultOptions()
{
    return {
        ea:
        {
            fitnessExpression:           'foodEaten - 2 * poisonEaten',
            tournamentGroupSize:         20,
            tournamentRandomProbability: 0.1,
            populationSize:              200,
            elitismCount:                5,
            mutationRate:                0.005,
            generationCount:             500
        },
        development:
        {
            grayCoding:       true,
            weightSwitchBits: true,
            inputLayer:
            {
                size: 6
            },
            hiddenLayer:
            {
                size: 6,
                weights:
                {
                    bits:                2,
                    inclusiveRangeStart: -1,
                    inclusiveRangeEnd:   +1
                },
                bias:
                {
                    bits:                3,
                    inclusiveRangeStart: -7,
                    inclusiveRangeEnd:   +7
                },
                activation: 'heaviside'
            },
            outputLayer:
            {
                size: 3,
                weights:
                {
                    bits:                2,
                    inclusiveRangeStart: -1,
                    inclusiveRangeEnd:   +1
                },
                bias:
                {
                    bits:                3,
                    inclusiveRangeStart: -7,
                    inclusiveRangeEnd:   +7
                },
                activation: 'heaviside'
            }
        },
        worldModel:
        {
            width:             10,
            height:            10,
            foodProbability:   1/3,
            poisonProbability: 1/3
        }
    };
}

export function runPerformanceTest(options, scenarioGeneration, scenarioCount, scenarioTimeSteps, consoleOutput=false, fileOutput=null)
{
    let scenarios = buildScenarios(scenarioCount, options.worldModel);

    let system = new ea.System(
    {
        populationSize:            options.ea.populationSize,
        elitismCount:              options.ea.elitismCount,
        genotypeCreationStrategy:  flatlandApp.createGenotypeCreator(options.development),
        parentSelectionStrategy:   new ea.parentSelection.Tournament(
            options.ea.tournamentGroupSize, options.ea.tournamentRandomProbability),
        adultSelectionStrategy:    new ea.adultSelection.FullGenerationalReplacement(),
        reproductionStrategy:      new ea.reproduction.Sexual(
            new ea.fixedBitVector.Crossover(1),
            new ea.fixedBitVector.Mutator(options.ea.mutationRate)),
        fitnessEvaluationStrategy: flatlandApp.createFitnessEvaluationStrategy(
            options.ea.fitnessExpression, scenarios, scenarioTimeSteps),
        developmentStrategy:       flatlandApp.createDevelopmentStrategy(options.development),
        diversityStrategy:
        {
            evaluate: ea.fixedBitVector.diversity
        }
    });

    let fileContents = "";

    for (let i = 0; i < options.ea.generationCount; i++)
    {
        if (fileOutput || consoleOutput)
        {
            const stats = system.stats();
            const text  = `${system.generation} ${stats.fitnessMean} ${stats.fitnessPStdDev} ${stats.bestIndividual.fitness} ${stats.diversity}`;

            if (fileOutput)
            {
                fileContents += text + '\n';
            }

            if (consoleOutput)
            {
                console.log(text);
            }
        }

        if (scenarioGeneration === 'dynamic')
        {
            // When in dynamic mode; generate new world models for each generation
            scenarios                        = buildScenarios(scenarioCount, options.worldModel);
            system.fitnessEvaluationStrategy = buildFitnessEvaluationStrategy(options.ea.fitnessExpression, scenarios, scenarioTimeSteps);
        }

        system.evolve();
    }

    const stats = system.stats();

    if (fileOutput || consoleOutput)
    {
        const text  = `${system.generation} ${stats.fitnessMean} ${stats.fitnessPStdDev} ${stats.bestIndividual.fitness} ${stats.diversity}`;

        if (fileOutput)
        {
            fileContents += text + '\n';
            fs.writeFileSync(fileOutput, fileContents);
        }

        if (consoleOutput)
        {
            console.log(text);
        }
    }

    return stats;
}

