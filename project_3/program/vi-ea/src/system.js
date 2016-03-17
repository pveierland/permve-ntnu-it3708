export class Individual
{
    constructor(genotype, phenotype, fitness)
    {
        this.genotype  = genotype;
        this.phenotype = phenotype;
        this.fitness   = fitness;
    }
}

let individual_generator = function*(
    creator_function, fitness_function, development_function = null)
{
    while (true)
    {
        let genotype  = creator_function.create();
        let phenotype = (development_function
            ? development_function.develop(genotype) : genotype);

        if (phenotype)
        {
            let fitness = fitness_function.evaluate(phenotype);

            if (fitness)
            {
                yield new Individual(genotype, phenotype, fitness);
            }
        }
    }
};

export class System
{
    constructor(creator_function,
                parent_selection_function,
                adult_selection_function,
                reproduction_function,
                fitness_function,
                population_size,
                development_function = null)
    {
        this.creator_function          = creator_function;
        this.parent_selection_function = parent_selection_function;
        this.adult_selection_function  = adult_selection_function;
        this.reproduction_function     = reproduction_function;
        this.fitness_function          = fitness_function;
        this.population_size           = population_size;
        this.development_function      = development_function;

        this.create_initial_population();
    }

    best_individual()
    {
        return this.population.reduce((pv, cv) => pv && pv.fitness > cv.fitness ? pv : cv, null);
    }

    create_initial_population()
    {
        let generator = individual_generator(
            this.creator_function, this.fitness_function, this.development_function);

        let population = [];

        for (let i = 0; i != this.population_size; i += 1)
        {
            population.push(generator.next().value);
        }

        this.population = population;
    }

    evolve()
    {
        let artifacts = this.parent_selection_function.prepare(
            this.population);

        let parent_selector = function*(population, parent_selection_function)
        {
            while (true)
            {
                yield parent_selection_function.select(population, artifacts);
            }
        }(this.population, this.parent_selection_function);

        let child_generator = function*(reproduction_function, development_function, fitness_function)
        {
            while (true)
            {
                let children_genotypes = reproduction_function.reproduce(parent_selector);

                for (let child_genotype of children_genotypes)
                {
                    let child_phenotype = (development_function
                        ? development_function(child_genotype)
                        : child_genotype);

                    if (child_phenotype)
                    {
                        let child_fitness = fitness_function.evaluate(child_phenotype);

                        if (child_fitness)
                        {
                            yield new Individual(child_genotype, child_phenotype, child_fitness);
                        }
                    }
                }
            }
        }(this.reproduction_function, this.development_function, this.fitness_function);

        this.population = this.adult_selection_function.select(
            this.population, child_generator);
    }
}
