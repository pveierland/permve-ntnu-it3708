import * as math from 'mathjs';

export class Individual
{
    constructor(genotype, phenotype, fitness)
    {
        this.genotype  = genotype;
        this.phenotype = phenotype;
        this.fitness   = fitness;
    }
}

export class System
{
    constructor(options)
    {
        this.populationSize            = options.populationSize;
        this.genotypeCreationStrategy  = options.genotypeCreationStrategy;
        this.parentSelectionStrategy   = options.parentSelectionStrategy;
        this.adultSelectionStrategy    = options.adultSelectionStrategy;
        this.reproductionStrategy      = options.reproductionStrategy;
        this.fitnessEvaluationStrategy = options.fitnessEvaluationStrategy;

        this.elitismCount              = options.elitismCount || 0;
        this.developmentStrategy       = options.developmentStrategy || null;
        this.diversityStrategy         = options.diversityStrategy || null;

        this.generation      = 0;
        this.generationCount = options.generationCount || 0;

        this.population = this.createInitialPopulation();
    }

    createInitialPopulation()
    {
        let population = new Array(this.populationSize);

        let individualGenerator = generator.individual(
            this,
            this.genotypeCreationStrategy,
            this.fitnessEvaluationStrategy,
            this.developmentStrategy);

        for (let i = 0; i != this.populationSize; i++)
        {
            population[i] = individualGenerator.next().value;
        }

        return population;
    }

    evolve()
    {
        for (let individual of this.population)
        {
            individual.fitness = this.fitnessEvaluationStrategy.evaluate(
                this, individual.genotype, individual.phenotype);
        }

        let elitists = null;

        if (this.elitismCount)
        {
            this.population.sort((a, b) => b.fitness - a.fitness);
            elitists = this.population.slice(0, this.elitismCount);
        }

        const artifacts      = this.parentSelectionStrategy.prepare(this.population);
        const parentSelector = generator.parent(this.population, artifacts, this.parentSelectionStrategy);
        const childGenerator = generator.child(
            this,
            parentSelector,
            this.reproductionStrategy,
            this.developmentStrategy,
            this.fitnessEvaluationStrategy);

        const nextGeneration = this.adultSelectionStrategy.select(this.populationSize - this.elitismCount, childGenerator);
        this.population      = elitists ? elitists.concat(nextGeneration) : nextGeneration;

        this.generation++;
    }

    stats()
    {
        let stats = {};

        stats.generation = this.generation;

        const fitnessValues = this.population.map(v => v.fitness);

        stats.fitnessMean    = math.mean(fitnessValues);
        stats.fitnessPStdDev = math.std(fitnessValues, 'uncorrected');

        stats.bestIndividual = this.population.reduce(
            (pv, cv) => pv && pv.fitness > cv.fitness ? pv : cv, null);

        if (this.diversityStrategy)
        {
            stats.diversity = this.diversityStrategy.evaluate(this.population);
        }

        return stats;
    }
}

const generator = Object.freeze(function()
{
    let g = {};

    g.child = function*(
        system,
        parentSelector,
        reproductionStrategy,
        developmentStrategy,
        fitnessEvaluationStrategy)
    {
        while (true)
        {
            const childrenGenotypes = reproductionStrategy.reproduce(parentSelector);

            for (const childGenotype of childrenGenotypes)
            {
                const childPhenotype = (developmentStrategy
                    ? developmentStrategy.develop(childGenotype)
                    : childGenotype);

                if (childPhenotype)
                {
                    let childFitness = fitnessEvaluationStrategy.evaluate(
                        system, childGenotype, childPhenotype);
                    yield new Individual(childGenotype, childPhenotype, childFitness);
                }
            }
        }
    };

    g.individual = function*(
        system, genotypeCreationStrategy, fitnessEvaluationStrategy, developmentStrategy = null)
    {
        while (true)
        {
            let genotype  = genotypeCreationStrategy.create();
            let phenotype = (developmentStrategy
                ? developmentStrategy.develop(genotype) : genotype);

            if (phenotype)
            {
                let fitness = fitnessEvaluationStrategy.evaluate(system, genotype, phenotype);
                yield new Individual(genotype, phenotype, fitness);
            }
        }
    };

    g.parent = function*(population, artifacts, parentSelectionStrategy)
    {
        while (true)
        {
            yield parentSelectionStrategy.select(population, artifacts);
        }
    };

    return g;
}());
