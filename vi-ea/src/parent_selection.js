import * as math from 'mathjs';

export class FitnessProportionate
{
    prepare(population)
    {
        const fitnessSum = population.reduce(
            (sum, individual) => sum + individual.fitness, 0);
        return { fitnessSum: fitnessSum };
    }

    select(population, artifacts)
    {
        let selectedIndividual = null;
        let randomFitnessSum   = math.random(artifacts.fitnessSum);

        for (let individual of population)
        {
            if (individual.fitness > 0)
            {
                selectedIndividual  = individual;
                randomFitnessSum   -= individual.fitness;

                if (randomFitnessSum < 0)
                {
                    break;
                }
            }
        }

        return selectedIndividual;
    }
}

export class Rank
{
    constructor(maxExpectedValue=1.5)
    {
        this.maxExpectedValue = maxExpectedValue;
        this.minExpectedValue = 2 - maxExpectedValue;
    }

    prepare(population)
    {
        population.sort((a, b) => a.fitness - b.fitness);
    }

    select(population, artifacts)
    {
        const populationSize = population.length;

        let selectedIndividual     = population[populationSize - 1];
        let randomExpectedValueSum = math.random(populationSize);

        for (let rankIndex = populationSize; rankIndex >= 1; rankIndex -= 1)
        {
            const expectedValue = this.minExpectedValue +
                + (this.maxExpectedValue - this.minExpectedValue)
                    * (rankIndex - 1) / (populationSize - 1);

            randomExpectedValueSum -= expectedValue;

            if (randomExpectedValueSum < 0)
            {
                selectedIndividual = population[rankIndex - 1];
                break;
            }

        }

        return selectedIndividual;
    }
}

export class Sigma
{
    prepare(population)
    {
        const fitnessValues  = population.map(v => v.fitness);
        const fitnessMean    = math.mean(fitnessValues);
        const fitnessPStdDev = math.std(fitnessValues, 'uncorrected');

        const expectedValues = fitnessValues.map(fitnessValue =>
            1 + (fitnessPStdDev > 0
                ? ((fitnessValue - fitnessMean) / (2 * fitnessPStdDev))
                : 0));

        const expectedValuesSum = expectedValues.reduce((sum, expectedValue) => sum + expectedValue, 0);

        return { expectedValues: expectedValues, expectedValuesSum: expectedValuesSum };
    }

    select(population, artifacts)
    {
        let selectedIndividual     = null;
        let randomExpectedValueSum = math.random(artifacts.expectedValuesSum);
        const populationSize       = population.length;

        for (let i = 0; i < populationSize; i += 1)
        {
            const individual    = population[i];
            const expectedValue = artifacts.expectedValues[i];

            selectedIndividual      = individual;
            randomExpectedValueSum -= expectedValue;

            if (randomExpectedValueSum < 0)
            {
                break;
            }
        }

        return selectedIndividual;
    }
}
