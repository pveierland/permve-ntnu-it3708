#pragma once

#include <vi/algo.h>

#include <boost/dynamic_bitset.hpp>
#include <boost/optional.hpp>

#include <algorithm>
#include <cassert>
#include <random>
#include <set>
#include <tuple>
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

        class dynamic_bit_vector : public boost::dynamic_bitset<>
        {
            public:
                dynamic_bit_vector() = default;
                dynamic_bit_vector(const unsigned length)
                    : boost::dynamic_bitset<>{length} {}
        };

        std::ostream&
        operator<<(std::ostream& os, const dynamic_bit_vector& genotype)
        {
            for (dynamic_bit_vector::size_type i = 0; i != genotype.size(); ++i)
            {
                if (i > 0)
                {
                    os << ", ";
                }

                os << genotype[i];
            }

            return os;
        }

        class dynamic_bit_vector_creator
        {
            public:
                using creation_type = dynamic_bit_vector;

                dynamic_bit_vector_creator(
                    const unsigned min_length,
                    const unsigned max_length,
                    const double   value_distribution_parameter = 0.5)
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
                std::uniform_int_distribution<unsigned> length_distribution_{};
                std::bernoulli_distribution             value_distribution_{};
        };

        unsigned genotype_length(const dynamic_bit_vector& genotype)
        {
            return genotype.size();
        }

        template <typename random_generator_type>
        void mutate(random_generator_type random_generator,
                    dynamic_bit_vector&   genotype,
                    const unsigned        pos)
        {
            genotype.flip(pos);
        }

        void crossover_at_points(const std::set<unsigned>& points,
                                 dynamic_bit_vector&       a,
                                 dynamic_bit_vector&       b)
        {
            dynamic_bit_vector temp_a{}, temp_b{};
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

        class dynamic_int_vector : public std::vector<unsigned>
        {
            public:
                dynamic_int_vector(
                    std::uniform_int_distribution<unsigned> value_distribution)
                    : value_distribution_{value_distribution} {}

                auto& value_distribution()
                {
                    return value_distribution_;
                }

            private:
                std::uniform_int_distribution<unsigned> value_distribution_{};
        };

        std::ostream&
        operator<<(std::ostream& os, const dynamic_int_vector& genotype)
        {
            bool first = true;

            for (const auto& x : genotype)
            {
                if (!first)
                {
                    os << ", ";
                }

                os << x;
                first = false;
            }

            return os;
        }

        class dynamic_int_vector_creator
        {
            public:
                using creation_type = dynamic_int_vector;

                dynamic_int_vector_creator(
                    const unsigned                          min_length,
                    const unsigned                          max_length,
                    std::uniform_int_distribution<unsigned> value_distribution)
                    : length_distribution_{min_length, max_length},
                      value_distribution_{value_distribution} {}

                template <typename random_generator_type>
                creation_type operator()(random_generator_type& random_generator)
                {
                    const auto length = length_distribution_(random_generator);
                    creation_type creation(value_distribution_);
                    creation.resize(length);

                    for (creation_type::size_type i = 0; i != creation.size(); ++i)
                    {
                        creation[i] = creation.value_distribution()(random_generator);
                    }

                    return creation;
                }

            private:
                std::uniform_int_distribution<unsigned> length_distribution_{};
                std::uniform_int_distribution<unsigned> value_distribution_{};
        };

        unsigned genotype_length(const dynamic_int_vector& genotype)
        {
            return genotype.size();
        }

        template <typename random_generator_type>
        void mutate(random_generator_type random_generator,
                    dynamic_int_vector&   genotype,
                    const unsigned        pos)
        {
            genotype[pos] = genotype.value_distribution()(random_generator);
        }

        void crossover_at_points(const std::set<unsigned>& points,
                                 dynamic_int_vector&       a,
                                 dynamic_int_vector&       b)
        {
            dynamic_int_vector temp_a{a.value_distribution()};
            dynamic_int_vector temp_b{b.value_distribution()};

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

            class generational_mixing
            {
                public:
                    generational_mixing(const unsigned num_children)
                        : num_children_(num_children) {}

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
                        const auto population_size = past_generation.size();
                        const auto num_competitors = population_size + num_children_;

                        while (past_generation.size() < num_competitors)
                        {
                            child_pool.clear();

                            reproduction_function(random_generator,
                                                  parent_selector,
                                                  past_generation,
                                                  child_pool);

                            for (auto& child : child_pool)
                            {
                                if (past_generation.size() == num_competitors)
                                {
                                    break;
                                }
                                else if (child.develop(fitness_function))
                                {
                                    past_generation.push_back(std::move(child));
                                }
                            }
                        }

                        std::sort(past_generation.begin(), past_generation.end(),
                                  [](const auto& a, const auto& b)
                                  {
                                      return b.fitness < a.fitness;
                                  });

                        if (past_generation.size() > population_size)
                        {
                            past_generation.erase(past_generation.begin() + population_size, past_generation.end());
                        }

                        std::swap(past_generation, next_generation);
                    }

                private:
                    unsigned num_children_{};
            };

            class overproduction
            {
                public:
                    overproduction(const unsigned num_children)
                        : num_children_(num_children) {}

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
                        const auto population_size = past_generation.size();

                        next_generation.clear();

                        while (next_generation.size() < num_children_)
                        {
                            child_pool.clear();

                            reproduction_function(random_generator,
                                                  parent_selector,
                                                  past_generation,
                                                  child_pool);

                            for (auto& child : child_pool)
                            {
                                if (next_generation.size() == num_children_)
                                {
                                    break;
                                }
                                else if (child.develop(fitness_function))
                                {
                                    next_generation.push_back(std::move(child));
                                }
                            }
                        }

                        std::sort(next_generation.begin(), next_generation.end(),
                                  [](const auto& a, const auto& b)
                                  {
                                      return b.fitness < a.fitness;
                                  });

                        if (next_generation.size() > population_size)
                        {
                            next_generation.erase(next_generation.begin() + population_size, next_generation.end());
                        }
                    }

                private:
                    unsigned num_children_{};
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

            class sigma
            {
                public:
                    template <typename random_generator_type, typename individual_type>
                    const individual_type&
                    operator()(random_generator_type&        random_generator,
                               std::vector<individual_type>& population)
                    {
                        auto selected_individual   = population.cbegin();
                        auto random_expected_value = random_expected_value_distribution_(random_generator);

                        auto individual     = population.cbegin();
                        auto expected_value = expected_values_.cbegin();

                        for (; individual != population.cend(); ++individual, ++expected_value)
                        {
                            selected_individual    = individual;
                            random_expected_value -= *expected_value;

                            if (random_expected_value < 0.0)
                            {
                                break;
                            }
                        }

                        return *selected_individual;
                    }

                    template <typename individual_type>
                    void register_population(std::vector<individual_type>& population)
                    {
                        const auto fitness_sum = std::accumulate(
                            population.begin(), population.end(), 0.0,
                            [](const auto& sum, const auto& individual)
                            {
                                return sum + individual.fitness;
                            });

                        const auto fitness_mean = fitness_sum / static_cast<double>(population.size());

                        expected_values_.resize(population.size());

                        std::transform(population.begin(), population.end(), expected_values_.begin(),
                            [fitness_mean](const auto& individual)
                            {
                                return individual.fitness - fitness_mean;
                            });

                        const auto fitness_square_sum = std::inner_product(
                            expected_values_.begin(), expected_values_.end(), expected_values_.begin(), 0.0);
                        const auto fitness_std_dev = std::sqrt(
                            fitness_square_sum / static_cast<double>(population.size()));

                        std::transform(population.begin(), population.end(), expected_values_.begin(),
                            [fitness_mean, fitness_std_dev](const auto& individual)
                            {
                                return 1.0 + (individual.fitness - fitness_mean) / (2.0 * fitness_std_dev);
                            });

                        const auto sum_expected_values = std::accumulate(
                            expected_values_.begin(), expected_values_.end(), 0.0);

                        random_expected_value_distribution_ = std::uniform_real_distribution<double>{0.0, sum_expected_values};
                    }

                private:
                    std::uniform_real_distribution<double> random_expected_value_distribution_{};
                    std::vector<double>                    expected_values_{};
            };

            class tournament
            {
                public:
                    tournament(const unsigned group_size, const double epsilon)
                        : group_size_{group_size},
                          select_best_individual_distribution_{1.0 - epsilon},
                          select_random_individual_distribution_{0U, group_size - 1U} {}

                    template <typename random_generator_type, typename individual_type>
                    const individual_type&
                    operator()(random_generator_type& random_generator, const std::vector<individual_type>& population)
                    {
                        ::vi::algo::generate_unique_in_range(
                            random_generator, group_member_indexes_, 0U, static_cast<unsigned>(population.size()) - 1U, group_size_);

                        const auto* selected_individual = &population[*group_member_indexes_.begin()];
                        const bool  select_best         = select_best_individual_distribution_(random_generator);

                        if (select_best)
                        {
                            for (const auto& index : group_member_indexes_)
                            {
                                if (population[index].fitness > selected_individual->fitness)
                                {
                                    selected_individual = &population[index];
                                }
                            }
                        }
                        else
                        {
                            selected_individual = &population[
                                select_random_individual_distribution_(random_generator)];
                        }

                        return *selected_individual;
                    }

                    template <typename individual_type>
                    void register_population(const std::vector<individual_type>& population)
                    {
                    }

                private:
                    unsigned                                group_size_{};
                    std::bernoulli_distribution             select_best_individual_distribution_{};
                    std::uniform_int_distribution<unsigned> select_random_individual_distribution_{};
                    std::set<unsigned>                      group_member_indexes_{};
            };
        }

        namespace reproduction
        {
            class sexual
            {
                public:
                    sexual(const double   mutation_rate,
                           const double   crossover_rate,
                           const unsigned num_crossover_points)
                        : mutation_distribution_{mutation_rate},
                          crossover_distribution_{crossover_rate},
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

                        if (crossover_distribution_(random_generator))
                        {
                            crossover_at_points(crossover_points_, child_a_genotype, child_b_genotype);
                        }

                        for (auto pos = 0; pos != genotype_length(child_a_genotype); ++pos)
                        {
                            if (mutation_distribution_(random_generator))
                            {
                                mutate(random_generator, child_a_genotype, pos);
                            }
                        }

                        for (auto pos = 0; pos != genotype_length(child_b_genotype); ++pos)
                        {
                            if (mutation_distribution_(random_generator))
                            {
                                mutate(random_generator, child_b_genotype, pos);
                            }
                        }

                        child_pool.emplace_back(child_a_genotype);
                        child_pool.emplace_back(child_b_genotype);
                    }

                private:
                    std::bernoulli_distribution mutation_distribution_{};
                    std::bernoulli_distribution crossover_distribution_{};
                    unsigned                    num_crossover_points_{};
                    std::set<unsigned>          crossover_points_{};
            };
        }

        template <typename random_generator_type,
                  typename individual_type_,
                  typename genotype_creator_type,
                  typename parent_selector_type,
                  typename reproduction_function_type,
                  //typename development_function_type,
                  typename fitness_function_type,
                  typename generational_replacement_type>
        class system
        {
            public:
                using individual_type = individual_type_;

                system(
                    random_generator_type         random_generator,
                    genotype_creator_type         genotype_creator,
                    //development_function_type development_function,
                    parent_selector_type          parent_selector,
                    reproduction_function_type    reproduction_function,
                    fitness_function_type         fitness_function,
                    generational_replacement_type generational_replacement,
                    unsigned                      population_size)
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
                    ++generation_;
                }

                auto stats()
                {
                    const auto fitness_sum = std::accumulate(
                        current_generation_.begin(), current_generation_.end(), 0.0,
                        [&](const auto& sum, const auto& individual)
                        {
                            return sum + individual.fitness;
                        });

                    const auto fitness_mean = fitness_sum / static_cast<double>(current_generation_.size());

                    deviations_.resize(current_generation_.size());

                    std::transform(current_generation_.begin(), current_generation_.end(), deviations_.begin(),
                        [fitness_mean](const auto& individual)
                        {
                            return individual.fitness - fitness_mean;
                        });

                    const auto fitness_square_sum = std::inner_product(
                        deviations_.begin(), deviations_.end(), deviations_.begin(), 0.0);

                    const auto fitness_std_dev = std::sqrt(fitness_square_sum / static_cast<double>(current_generation_.size()));

                    const auto best_individual = std::max_element(
                        current_generation_.begin(), current_generation_.end(),
                        [](const auto& a, const auto& b)
                        {
                            return a.fitness < b.fitness;
                        });

                    return std::make_tuple(generation_, fitness_mean, fitness_std_dev, &*best_individual);
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
                unsigned                      population_size_{};

                unsigned                      generation_{};
                std::vector<individual_type>  current_generation_{};
                std::vector<individual_type>  next_generation_{};
                std::vector<individual_type>  child_pool_{};
                std::vector<double>           deviations_{};
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
                          unsigned                      population_size,
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

