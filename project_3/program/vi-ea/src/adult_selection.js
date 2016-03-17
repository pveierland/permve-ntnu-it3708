export class FullGenerationalReplacement
{
    select(population, child_generator)
    {
        let next_generation = [];

        for (let i = 0; i != population.length; i += 1)
        {
            next_generation.push(child_generator.next().value);
        }

        return next_generation;
    }
}
