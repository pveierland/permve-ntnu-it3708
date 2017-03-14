#pragma once

#include <algorithm>
#include <cassert>
#include <limits>
#include <utility>
#include <vector>

#include "vi_algo.hpp"

namespace vi
{
    namespace ea
    {
        namespace nsga2
        {
            template <typename genotype_type>
            struct individual
            {
                genotype_type            genotype{};
                std::vector<double>      objective_values{};
                std::vector<individual*> S{};
                double                   crowding_distance{};
                unsigned                 n{};
                unsigned                 rank{};

                individual(genotype_type       genotype,
                           std::vector<double> objective_values)
                    : genotype(std::move(genotype)),
                      objective_values(std::move(objective_values))
                {
                }

                bool
                dominates(const individual& other)
                {
                    assert(objective_values.size() == other.objective_values.size());

                    auto objective_value_it           = objective_values.begin();
                    auto other_objective_value_it     = other.objective_values.begin();
                    const auto objective_value_end_it = objective_values.end();

                    while (objective_value_it != objective_value_end_it)
                    {
                        if (*other_objective_value_it <= *objective_value_it)
                        {
                            return false;
                        }

                        ++objective_value_it;
                        ++other_objective_value_it;
                    }

                    return true;
                }

                bool
                operator<(const individual& other)
                {
                    return rank < other.rank || (rank == other.rank && crowding_distance > other.crowding_distance);
                }
            };

            struct options
            {
                double   crossover_rate{};
                double   mutation_rate{};
                unsigned objective_count{};
                unsigned population_size{};
                unsigned tournament_group_size{};
                double   tournament_randomness{};
            };

            template <typename genotype_type,
                      typename genotype_creator_type,
                      typename objective_evaluator_type,
                      typename crossover_operator_type,
                      typename mutation_operator_type>
            struct system
            {
                using individual_type = individual<genotype_type>;

                options                       system_options;
                genotype_creator_type         genotype_creator;
                objective_evaluator_type      objective_evaluator;
                crossover_operator_type       crossover_operator;
                mutation_operator_type        mutation_operator;

                unsigned                      generation;
                std::vector<double>           range_min;
                std::vector<double>           range_max;
                std::vector<individual_type*> extreme_min;
                std::vector<individual_type*> extreme_max;

                std::vector<individual_type>               population{};
                std::vector<std::vector<individual_type*>> fronts;

                std::set<std::size_t>                      tournament_group{};
                std::bernoulli_distribution                tournament_select_best_distribution;

                system(const options&           system_options,
                       genotype_creator_type    genotype_creator,
                       objective_evaluator_type objective_evaluator,
                       crossover_operator_type  crossover_operator,
                       mutation_operator_type   mutation_operator)
                    : system_options{system_options},
                      genotype_creator{std::move(genotype_creator)},
                      objective_evaluator{std::move(objective_evaluator)},
                      crossover_operator{std::move(crossover_operator)},
                      mutation_operator{std::move(mutation_operator)},
                      generation{0},
                      range_min(system_options.objective_count,   +std::numeric_limits<double>::infinity()),
                      range_max(system_options.objective_count,   -std::numeric_limits<double>::infinity()),
                      extreme_min(system_options.objective_count, nullptr),
                      extreme_min(system_options.objective_count, nullptr),
                      fronts(system_options.population_size),
                      tournament_select_best_distribution{1.0 - system_options.tournament_randomness}
                {
                    population.reserve(system_options.population_size);
                    create_initial_population();
                }

                void
                create_initial_population()
                {
                    population.clear();

                    for (auto& front : fronts)
                    {
                        front.clear();
                    }

                    for (auto i = system_options.population_size; i != 0; --i)
                    {
                        auto genotype         = genotype_creator();
                        auto objective_values = objective_evaluator(genotype);
                        population.emplace_back(std::move(genotype), std::move(objective_values));
                    }
                }

                void
                assign_crowding_distances(
                    std::vector<individual_type*>& front, const bool is_non_dominated_front)
                {
                    for (auto individual : front)
                    {
                        individual->crowding_distance = 0.0;
                    }

                    for (unsigned objective = 0; objective != system_options.objective_count; ++objective)
                    {
                        std::sort(front.begin(), front.end(),
                            [objective](individual_type* a, individual_type* b)
                            {
                                return a->objective_values[objective] < b->objective_values[objective];
                            });

                        const auto min_individual = *front.begin();
                        const auto max_individual = *front.rbegin();

                        min_individual->crowding_distance = std::numeric_limits<double>::infinity();
                        max_individual->crowding_distance = std::numeric_limits<double>::infinity();

                        range_min[objective] = std::min(range_min[objective], min_individual.objective_values[objective]);
                        range_max[objective] = std::max(range_max[objective], max_individual.objective_values[objective]);

                        if (is_non_dominated_front)
                        {
                            extreme_min[objective] = min_individual;
                        }

                        if (!extreme_max[objective] or
                            max_individual->objective_values[objective] > extreme_max[objective].objective_values[objective])
                        {
                            extreme_max[objective] = max_individual;
                        }

                        const auto range_delta   = range_max[objective] - range_min[objective];
                        const auto range_scaling = range_delta != 0.0 ? 1.0 / range_delta : 1.0;

                        for (typename std::vector<individual_type*>::size_type i = 1; i != front.size() - 1; ++i)
                        {
                            front[i]->crowding_distance += range_scaling *
                                (front[i + 1]->objective_values[objective] -
                                 front[i - 1]->objective_values[objective]);
                        }
                    }
                }

//                void
//                evolve()
//                {
//                    for (unsigned objective = 0; objective != system_options.objective_count; ++objective)
//                    {
//                        extreme_max[objective] = nullptr;
//                    }
//
//
//                }
//
//                void
//                generate_individuals(const std::vector<individual_type>& population,
//                                     std::vector<individual_type>&       offspring)
//                {
//                    while (offspring.size() < system_options.population_size)
//                    {
//                        const auto parent_a = tournament_selector(population);
//                        const auto parent_b = tournament_selector(population);
//
//                    }
//                }

                template <typename random_generator_type>
                individual_type*
                tournament_selector(random_generator_type&                       random_generator,
                                    const typename std::vector<individual_type>& population)
                {
                    const bool select_best_individual = tournament_select_best_distribution(random_generator);

                    if (select_best_individual)
                    {
                        ::vi::algo::generate_unique_in_range(
                            random_generator,
                            tournament_group,
                            0U,
                            system_options.population_size - 1U,
                            system_options.tournament_group_size);

                        const individual_type* selected_individual = nullptr;

                        for (const auto index : tournament_group)
                        {
                            const auto& individual = population[index];
                            if (!selected_individual or individual.fitness > selected_individual->fitness)
                            {
                                selected_individual = &individual;
                            }
                        }

                        return selected_individual;
                    }
                    else
                    {
                        const auto random_individual_index = std::uniform_int_distribution<>{
                            0U, population.size()}(random_generator);
                        return &population[random_individual_index];
                    }
                }
            };
        }
    }
}
