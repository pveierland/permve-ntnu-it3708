export class FullGenerationalReplacement
{
    select(population, childGenerator)
    {
        const populationSize = population.length;
        let nextGeneration   = new Array(populationSize);

        for (let i = 0; i != population.length; i++)
        {
            nextGeneration[i] = childGenerator.next().value;
        }

        return nextGeneration;
    }
}
