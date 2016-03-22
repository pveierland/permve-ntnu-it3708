function get_random_arbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

export class FitnessProportionate
{
    prepare(population)
    {
        const fitness_sum = population.reduce(
            (sum, individual) => sum + individual.fitness, 0);
        return { 'fitness_sum': fitness_sum };
    }

    select(population, artifacts)
    {
        let random_fitness_sum = get_random_arbitrary(0, artifacts.fitness_sum);
        let selected_individual  = null;

        for (let individual of population)
        {
            if (individual.fitness > 0)
            {
                selected_individual = individual;
                random_fitness_sum -= individual.fitness;

                if (random_fitness_sum < 0)
                {
                    break;
                }
            }
        }

        return selected_individual;
    }
}
