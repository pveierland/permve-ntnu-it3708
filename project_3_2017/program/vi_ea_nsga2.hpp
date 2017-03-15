#pragma once

#include <algorithm>
#include <cassert>
#include <iterator>
#include <limits>
#include <tuple>
#include <utility>
#include <vector>

#include <boost/optional.hpp>

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
                dominates(const individual& other) const
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
                operator<(const individual& other) const
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

                options                                       system_options;
                genotype_creator_type                         genotype_creator;
                objective_evaluator_type                      objective_evaluator;
                crossover_operator_type                       crossover_operator;
                mutation_operator_type                        mutation_operator;

                unsigned                                      generation;
                std::vector<double>                           range_min;
                std::vector<double>                           range_max;
                std::vector<boost::optional<individual_type>> extreme_min;
                std::vector<boost::optional<individual_type>> extreme_max;

                std::vector<individual_type>                  current_population{};
                std::vector<individual_type>                  next_population{};
                std::vector<individual_type>                  offspring{};
                std::vector<std::vector<individual_type*>>    fronts;

                std::bernoulli_distribution                   crossover_distribution;
                std::bernoulli_distribution                   mutation_distribution;
                std::set<unsigned>                            tournament_group{};
                std::bernoulli_distribution                   tournament_select_best_distribution;

                template <typename random_generator_type>
                system(random_generator_type&   random_generator,
                       const options&           system_options,
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
                      extreme_min(system_options.objective_count),
                      extreme_max(system_options.objective_count),
                      fronts(system_options.population_size),
                      crossover_distribution{system_options.crossover_rate},
                      mutation_distribution{system_options.mutation_rate},
                      tournament_select_best_distribution{1.0 - system_options.tournament_randomness}
                {
                    current_population.reserve(system_options.population_size);
                    next_population.reserve(system_options.population_size);
                    offspring.reserve(system_options.population_size);
                    create_initial_population(random_generator);
                }

                template <typename random_generator_type>
                void
                create_initial_population(random_generator_type& random_generator)
                {
                    current_population.clear();

                    for (auto& front : fronts)
                    {
                        front.clear();
                    }

                    for (auto i = system_options.population_size; i != 0; --i)
                    {
                        auto genotype         = genotype_creator(random_generator);
                        auto objective_values = objective_evaluator(genotype);
                        current_population.emplace_back(std::move(genotype), std::move(objective_values));
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

                        range_min[objective] = std::min(range_min[objective], min_individual->objective_values[objective]);
                        range_max[objective] = std::max(range_max[objective], max_individual->objective_values[objective]);

                        if (is_non_dominated_front)
                        {
                            extreme_min[objective] = *min_individual;
                        }

                        if ((!extreme_max[objective]) or
                            (max_individual->objective_values[objective] > extreme_max[objective]->objective_values[objective]))
                        {
                            extreme_max[objective] = *max_individual;
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

                template <typename random_generator_type>
                void
                evolve(random_generator_type& random_generator)
                {
                    for (auto& entry : extreme_max)
                    {
                        entry = boost::none;
                    }

                    offspring.clear();
                    generate_individuals(random_generator);

                    std::move(offspring.begin(), offspring.end(), std::back_inserter(current_population));
                    fast_non_dominated_sort();

                    next_population.clear();
                    auto remaining = system_options.population_size;
                    auto first = true;

                    for (auto& front : fronts)
                    {
                        if (remaining > 0)
                        {
                            assign_crowding_distances(front, first);
                            first = false;

                            const auto front_size = static_cast<unsigned>(front.size());

                            if (front_size <= remaining)
                            {
                                for (auto individual : front)
                                {
                                    next_population.emplace_back(std::move(*individual));
                                }

                                remaining -= front_size;
                            }
                            else
                            {
                                // Shuffle to avoid order bias from crowding_distance_assignment
                                std::shuffle(front.begin(), front.end(), random_generator);
                                std::sort(front.begin(), front.end(),
                                    [](const auto a, const auto b)
                                    {
                                        return (*a) < (*b);
                                    });

                                for (auto individual = front.begin(); individual != front.begin() + remaining; ++individual)
                                {
                                    next_population.emplace_back(std::move(**individual));
                                }

                                remaining = 0;
                            }
                        }
                        else
                        {
                            if (!front.empty())
                            {
                                front.clear();
                            }
                            else
                            {
                                break;
                            }
                        }
                    }

                    current_population.clear();
                    std::swap(current_population, next_population);
                    ++generation;
                }

                void
                fast_non_dominated_sort()
                {
                    for (auto& front : fronts)
                    {
                        front.clear();
                    }

                    for (auto& individual : current_population)
                    {
                        individual.S.clear();
                        individual.n = 0U;
                    }

                    const auto end = current_population.end();

                    for (auto p = current_population.begin(); p != end; ++p)
                    {
                        for (auto q = p + 1; q != end; ++q)
                        {
                            if (p->dominates(*q))
                            {
                                p->S.push_back(&*q);
                                ++q->n;
                            }
                            else if (q->dominates(*p))
                            {
                                q->S.push_back(&*p);
                                ++p->n;
                            }
                        }

                        if (p->n == 0)
                        {
                            p->rank = 0;
                            fronts[0].push_back(&*p);
                        }
                    }

                    for (auto front_index = 0U; !fronts[front_index].empty(); ++front_index)
                    {
                        for (auto p : fronts[front_index])
                        {
                            for (auto q : p->S)
                            {
                                if (--q->n == 0)
                                {
                                    q->rank = front_index + 1U;
                                    fronts[front_index + 1].push_back(&*q);
                                }
                            }
                        }
                    }
                }

                template <typename random_generator_type>
                void
                generate_individuals(random_generator_type& random_generator)
                {
                    while (offspring.size() < system_options.population_size)
                    {
                        const auto parent_a = tournament_selector(random_generator, current_population);
                        const auto parent_b = tournament_selector(random_generator, current_population);

                        genotype_type child_a_genotype{};
                        genotype_type child_b_genotype{};

                        if (crossover_distribution(random_generator))
                        {
                            std::tie(child_a_genotype, child_b_genotype) = crossover_operator(
                                random_generator, parent_a->genotype, parent_b->genotype);
                        }
                        else
                        {
                            child_a_genotype = parent_a->genotype;
                            child_b_genotype = parent_b->genotype;
                        }

                        if (mutation_distribution(random_generator))
                        {
                            mutation_operator(random_generator, child_a_genotype);
                        }

                        if (mutation_distribution(random_generator))
                        {
                            mutation_operator(random_generator, child_b_genotype);
                        }

                        auto child_a_objective_values = objective_evaluator(child_a_genotype);
                        auto child_b_objective_values = objective_evaluator(child_b_genotype);

                        offspring.emplace_back(std::move(child_a_genotype), std::move(child_a_objective_values));
                        offspring.emplace_back(std::move(child_b_genotype), std::move(child_b_objective_values));
                    }
                }

                template <typename random_generator_type>
                const individual_type*
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
                            if (!selected_individual or (individual < (*selected_individual)))
                            {
                                selected_individual = &individual;
                            }
                        }

                        return selected_individual;
                    }
                    else
                    {
                        const auto random_individual_index = std::uniform_int_distribution<unsigned>{
                            0U, static_cast<unsigned>(population.size()) - 1U}(random_generator);
                        return &(population[random_individual_index]);
                    }
                }
            };

            template <typename genotype_type,
                      typename random_generator_type,
                      typename genotype_creator_type,
                      typename objective_evaluator_type,
                      typename crossover_operator_type,
                      typename mutation_operator_type>
            auto
            build_system(random_generator_type&   random_generator,
                         const options&           system_options,
                         genotype_creator_type    genotype_creator,
                         objective_evaluator_type objective_evaluator,
                         crossover_operator_type  crossover_operator,
                         mutation_operator_type   mutation_operator)
            {
                using system_type = system<genotype_type,
                                           genotype_creator_type,
                                           objective_evaluator_type,
                                           crossover_operator_type,
                                           mutation_operator_type>;

                return system_type{random_generator,
                                   system_options,
                                   std::move(genotype_creator),
                                   std::move(objective_evaluator),
                                   std::move(crossover_operator),
                                   std::move(mutation_operator)};
            }
        }
    }
}
