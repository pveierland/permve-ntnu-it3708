#pragma once

#include <iostream>

#include <vi/algo.h>

#include <boost/accumulators/accumulators.hpp>
#include <boost/accumulators/statistics/mean.hpp>
#include <boost/accumulators/statistics/stats.hpp>
#include <boost/dynamic_bitset.hpp>
#include <boost/optional.hpp>

#include <algorithm>
#include <cassert>
#include <random>
#include <set>
#include <utility>
#include <vector>

namespace vi
{
    namespace ea
    {
        template <typename genotype_t,
                  typename phenotype_t>
        struct individual
        {
            using genotype_type  = genotype_t;
            using phenotype_type = phenotype_t;

            individual(const genotype_type& genotype)
                : genotype{genotype} {}

            template <typename fitness_function_type>
            bool develop(fitness_function_type& fitness_function)
            {
                fitness = fitness_function(genotype);
                return true;
            }

            genotype_type                   genotype{};
            boost::optional<phenotype_type> phenotype{};
            double                          fitness{};
        };

        unsigned genotype_length(const boost::dynamic_bitset<>& genotype)
        {
            return genotype.size();
        }

        void mutate(boost::dynamic_bitset<>& genotype, const unsigned pos)
        {
            genotype.flip(pos);
        }

        void crossover_at_points(const std::set<unsigned>& points,
                                 boost::dynamic_bitset<>&  a,
                                 boost::dynamic_bitset<>&  b)
        {
            boost::dynamic_bitset<> temp_a{}, temp_b{};
            auto *to_x = &temp_a, *to_y = &temp_b;

            unsigned from_point = 0;

            for (const auto point : points)
            {
                for (auto i = from_point; i < point; ++i)
                {
                    to_x->push_back(b[i]);
                    to_y->push_back(a[i]);
                }

                std::swap(to_x, to_y);
                from_point = point;
            }

            for (auto i = from_point; i != b.size(); ++i)
            {
                to_x->push_back(b[i]);
            }

            for (auto i = from_point; i != a.size(); ++i)
            {
                to_y->push_back(a[i]);
            }

            a = temp_a;
            b = temp_b;
        }

        class dynamic_bit_vector_creator
        {
            public:
                using creation_type = boost::dynamic_bitset<>;

                dynamic_bit_vector_creator(
                    const std::size_t min_length,
                    const std::size_t max_length,
                    const double      value_distribution_parameter = 0.5)
                    : length_distribution_{min_length, max_length},
                      value_distribution_{value_distribution_parameter} {}

                template <typename random_generator_type>
                creation_type operator()(random_generator_type& random_generator)
                {
                    const auto length = length_distribution_(random_generator);
                    creation_type creation{length};

                    for (creation_type::size_type i = 0; i != creation.size(); ++i)
                    {
                        creation[i] = value_distribution_(random_generator);
                    }

                    return creation;
                }

            private:
                std::uniform_int_distribution<std::size_t> length_distribution_{};
                std::bernoulli_distribution                value_distribution_{};
        };

        namespace adult_selection
        {
            class full_generational_replacement
            {
                public:
                    template <typename random_generator_type,
                              typename individual_type,
                              typename parent_selector_type,
                              typename reproduction_function_type,
                              typename fitness_function_type>
                    void operator()(random_generator_type&        random_generator,
                                    std::vector<individual_type>& past_generation,
                                    std::vector<individual_type>& next_generation,
                                    std::vector<individual_type>& child_pool,
                                    parent_selector_type&         parent_selector,
                                    reproduction_function_type&   reproduction_function,
                                    fitness_function_type&        fitness_function)
                    {
                        next_generation.clear();

                        while (next_generation.size() < past_generation.size())
                        {
                            child_pool.clear();

                            reproduction_function(random_generator,
                                                  parent_selector,
                                                  past_generation,
                                                  child_pool);

                            for (auto& child : child_pool)
                            {
                                if (next_generation.size() == past_generation.size())
                                {
                                    break;
                                }
                                else if (child.develop(fitness_function))
                                {
                                    next_generation.push_back(std::move(child));
                                }
                            }
                        }
                    }
            };
        }

        namespace parent_selection
        {
            class fitness_proportionate
            {
                public:
                    template <typename random_generator_type, typename individual_type>
                    const individual_type&
                    operator()(random_generator_type&        random_generator,
                               std::vector<individual_type>& population)
                    {
                        auto random_individual = typename std::vector<individual_type>::const_iterator{};
                        auto random_fitness    = random_fitness_distribution_(random_generator);

                        for (auto individual = population.cbegin();
                             individual != population.cend();
                             ++individual)
                        {
                            if (individual->fitness > 0.0)
                            {
                                random_individual = individual;
                                random_fitness -= individual->fitness;

                                if (random_fitness < 0.0)
                                {
                                    break;
                                }
                            }
                        }

                        return *random_individual;
                    }

                    template <typename individual_type>
                    void register_population(std::vector<individual_type>& population)
                    {
                        auto fitness_sum = 0.0;

                        for (const auto& individual : population)
                        {
                            fitness_sum += individual.fitness;
                        }

                        random_fitness_distribution_ = std::uniform_real_distribution<double>{0.0, fitness_sum};
                    }

                private:
                    std::uniform_real_distribution<double> random_fitness_distribution_{};
            };

            class sigma
            {
                public:
                    template <typename random_generator_type, typename individual_type>
                    const individual_type&
                    operator()(random_generator_type&        random_generator,
                               std::vector<individual_type>& population)
                    {
                        return *population.begin();
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//                        const auto* random_individual = &*population.rbegin();
//                        auto        random_fitness    = random_fitness_distribution_(random_generator);
//
//                        auto rank_index = 1.0;
//
//                        for (auto individual = population.cbegin();
//                             individual != population.cend();
//                             ++individual, ++rank_index)
//                        {
//                            const auto expected_reproduction =
//                                min_ + (max_ - min_) * (rank_index - 1.0) / (static_cast<double>(population.size()) - 1.0);
//
//                            random_fitness -= expected_reproduction;
//
//                            if (random_fitness < 0.0)
//                            {
//                                random_individual = &*individual;
//                                break;
//                            }
//                        }
//
//                        return *random_individual;
                    }

                    template <typename individual_type>
                    void register_population(std::vector<individual_type>& population)
                    {
                        using namespace boost::accumulators;

                        std::for_each(population.begin(), population.end(),
                            [&](const auto& individual)
                            {
                                acc(individual.fitness);
                            });




                        const auto fitness_sum = std::accumulate(
                            population.begin(), population.end(), 0.0,
                            [](const auto& a, const auto& b)
                            {
                                return a + b.fitness;
                            });

                        const auto fitness_mean = fitness_sum / static_cast<double>(population.size());

                        std::vector<double>





//                        random_fitness_distribution_ = std::uniform_real_distribution<double>{
//                            0.0, static_cast<double>(population.size())};
//
//                        std::sort(population.begin(), population.end(),
//                                  [] (const auto& a, const auto& b)
//                                  {
//                                      return a.fitness < b.fitness;
//                                  });
                    }

                private:
                    //std::uniform_real_distribution<double> random_fitness_distribution_{};
            };

            class rank
            {
                public:
                    rank(const double max) : min_{2.0 - max}, max_{max} {}

                    template <typename random_generator_type, typename individual_type>
                    const individual_type&
                    operator()(random_generator_type&        random_generator,
                               std::vector<individual_type>& population)
                    {
                        const auto* random_individual = &*population.rbegin();
                        auto        random_fitness    = random_fitness_distribution_(random_generator);

                        auto rank_index = 1.0;

                        for (auto individual = population.cbegin();
                             individual != population.cend();
                             ++individual, ++rank_index)
                        {
                            const auto expected_reproduction =
                                min_ + (max_ - min_) * (rank_index - 1.0) / (static_cast<double>(population.size()) - 1.0);

                            random_fitness -= expected_reproduction;

                            if (random_fitness < 0.0)
                            {
                                random_individual = &*individual;
                                break;
                            }
                        }

                        return *random_individual;
                    }

                    template <typename individual_type>
                    void register_population(std::vector<individual_type>& population)
                    {
                        random_fitness_distribution_ = std::uniform_real_distribution<double>{
                            0.0, static_cast<double>(population.size())};

                        std::sort(population.begin(), population.end(),
                                  [] (const auto& a, const auto& b)
                                  {
                                      return a.fitness < b.fitness;
                                  });
                    }

                private:
                    double                                 min_{};
                    double                                 max_{};
                    std::uniform_real_distribution<double> random_fitness_distribution_{};
            };


//            class tournament
//            {
//                public:
//                    tournament(const std::size_t group_size, const double epsilon)
//                        : group_size_{group_size},
//                          select_best_individual_distribution_{1.0 - epsilon} {}
//
//                    template <typename random_generator_type, typename individual_type>
//                    const individual_type&
//                    operator()(random_generator_type& random_generator, const std::vector<individual_type>& population)
//                    {
//                        const bool select_best = select_best_individual_distribution_(random_generator);
//
//                        if (select_best)
//                        {
//                            for (int i = 0; i != group_size_; ++i)
//                            {
//                                const auto random_individual_index = select_random_individual_distribution_(random_generator);
//
//                            }
//
//
//
//
//                            const auto best_individual_iterator = std::max_element(
//                                population.begin(), population.end(),
//                                [](const individual_type& a, const individual_type& b)
//                                {
//                                    return a.fitness < b.fitness;
//                                });
//
//                            return *best_individual_iterator;
//                        }
//                        else
//                        {
//                            const auto random_individual_index = select_random_individual_distribution_(random_generator);
//                            return population[random_individual_index];
//                        }
//                    }
//
//                    template <typename individual_type>
//                    void register_population(const std::vector<individual_type>& population)
//                    {
//                        assert(population.size() > 1);
//                        select_random_individual_distribution_ = std::uniform_int_distribution<std::size_t>{0, population.size() - 1};
//                    }
//
//                private:
//                    std::size_t                                group_size_{};
//                    std::bernoulli_distribution                select_best_individual_distribution_{};
//                    std::uniform_int_distribution<std::size_t> select_random_individual_distribution_{};
//            };
        }

        namespace reproduction
        {
            class sexual
            {
                public:
                    sexual(const double mutation_rate, const unsigned num_crossover_points)
                        : mutation_distribution_{mutation_rate},
                          num_crossover_points_{num_crossover_points}
                    {
                        assert(num_crossover_points > 0);
                    }

                    template <typename random_generator_type,
                              typename parent_selector_type,
                              typename individual_type>
                    void operator()(random_generator_type&        random_generator,
                                    parent_selector_type&         parent_selector,
                                    std::vector<individual_type>& population,
                                    std::vector<individual_type>& child_pool)
                    {
                        using namespace ::vi::ea;

                        auto child_a_genotype = parent_selector(random_generator, population).genotype;
                        auto child_b_genotype = parent_selector(random_generator, population).genotype;

                        const auto shortest_genotype_length = ::std::min(
                            genotype_length(child_a_genotype), genotype_length(child_b_genotype));

                        assert(shortest_genotype_length > num_crossover_points_);

                        ::vi::algo::generate_unique_in_range(
                            random_generator, crossover_points_, 1U, shortest_genotype_length - 1U, num_crossover_points_);

                        crossover_at_points(crossover_points_, child_a_genotype, child_b_genotype);

                        for (auto pos = 0; pos != genotype_length(child_a_genotype); ++pos)
                        {
                            if (mutation_distribution_(random_generator))
                            {
                                mutate(child_a_genotype, pos);
                            }
                        }

                        for (auto pos = 0; pos != genotype_length(child_b_genotype); ++pos)
                        {
                            if (mutation_distribution_(random_generator))
                            {
                                mutate(child_b_genotype, pos);
                            }
                        }

                        child_pool.emplace_back(child_a_genotype);
                        child_pool.emplace_back(child_b_genotype);
                    }

                private:
                    std::bernoulli_distribution mutation_distribution_{};
                    unsigned                    num_crossover_points_{};
                    std::set<unsigned>          crossover_points_{};
            };
        }

        template <typename random_generator_type,
                  typename individual_type,
                  typename genotype_creator_type,
                  typename parent_selector_type,
                  typename reproduction_function_type,
                  //typename development_function_type,
                  typename fitness_function_type,
                  typename generational_replacement_type>
        class system
        {
            public:
                system(
                    random_generator_type         random_generator,
                    genotype_creator_type         genotype_creator,
                    //development_function_type development_function,
                    parent_selector_type          parent_selector,
                    reproduction_function_type    reproduction_function,
                    fitness_function_type         fitness_function,
                    generational_replacement_type generational_replacement,
                    std::size_t                   population_size)
                    : random_generator_{random_generator},
                      genotype_creator_{genotype_creator},
                      //development_function_{development_function},
                      parent_selector_{parent_selector},
                      reproduction_function_{reproduction_function},
                      fitness_function_{fitness_function},
                      generational_replacement_{generational_replacement},
                      population_size_{population_size}
                {
                    initialize_population();
                }

                void evolve()
                {
                    parent_selector_.register_population(current_generation_);

                    generational_replacement_(random_generator_,
                                              current_generation_,
                                              next_generation_,
                                              child_pool_,
                                              parent_selector_,
                                              reproduction_function_,
                                              fitness_function_);

                    current_generation_.clear();
                    child_pool_.clear();

                    std::swap(current_generation_, next_generation_);
                }

                double max_fitness()
                {
                    double max_fitness = 0.0;
                    for (const auto& individual : current_generation_)
                    {
                        max_fitness = std::max(max_fitness, individual.fitness);
                    }
                    return max_fitness;
                }

                double mean_fitness()
                {
                    double sum = 0.0;
                    for (const auto& individual : current_generation_)
                    {
                        sum += individual.fitness;
                    }
                    return sum / current_generation_.size();
                }

            private:
                void initialize_population()
                {
                    current_generation_.reserve(population_size_);

                    while (current_generation_.size() < population_size_)
                    {
                        auto spawn = individual_type{genotype_creator_(random_generator_)};
                        if (spawn.develop(fitness_function_))
                        {
                            current_generation_.push_back(std::move(spawn));
                        }
                    }
                }

                random_generator_type         random_generator_{};
                genotype_creator_type         genotype_creator_{};
                parent_selector_type          parent_selector_{};
                reproduction_function_type    reproduction_function_{};
//                development_function_type    development_function_{};
                fitness_function_type         fitness_function_{};
                generational_replacement_type generational_replacement_{};
                std::size_t                   population_size_{};

                std::vector<individual_type>  current_generation_{};
                std::vector<individual_type>  next_generation_{};
                std::vector<individual_type>  child_pool_{};
        };

        template <typename random_generator_type,
                  typename genotype_creator_type,
                  typename parent_selector_type,
                  typename reproduction_function_type,
                  typename generational_replacement_type,
                  typename fitness_function_type>
        auto build_system(random_generator_type         random_generator,
                          genotype_creator_type         genotype_creator,
                          parent_selector_type          parent_selector,
                          reproduction_function_type    reproduction_function,
                          generational_replacement_type generational_replacement,
                          std::size_t                   population_size,
                          fitness_function_type         fitness_function)
        {
            return system<random_generator_type,
                          individual<typename genotype_creator_type::creation_type,
                                     typename genotype_creator_type::creation_type>,
                          genotype_creator_type,
                          parent_selector_type,
                          reproduction_function_type,
                          fitness_function_type,
                          generational_replacement_type>(
                random_generator,
                genotype_creator,
                parent_selector,
                reproduction_function,
                fitness_function,
                generational_replacement,
                population_size);
        }
    }
}

