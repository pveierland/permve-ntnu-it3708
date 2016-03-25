import * as utility from '../../vi-utility/vi-utility';

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
        let randomFitnessSum   = utility.random.uniform(0, artifacts.fitnessSum);

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
        let randomExpectedValueSum = utility.random.uniform(0, populationSize);

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
