#include <algorithm>
#include <cassert>
#include <functional>
#include <iostream>
#include <random>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#include <boost/accumulators/accumulators.hpp>
#include <boost/accumulators/statistics/mean.hpp>
#include <boost/accumulators/statistics/variance.hpp>
#include <boost/dynamic_bitset.hpp>
#include <boost/optional.hpp>
#include <boost/type_index.hpp>

namespace vi
{
    //namespace algo
    //{
    //    template <class bidirectional_iterator>
    //    bidirectional_iterator random_unique(
    //        bidirectional_iterator first, bidirectional_iterator last, std::size_t num_random)
    //    {
    //        auto left = std::distance(first, last);

    //        while (num_random--)
    //        {
    //            auto r = first;
    //            std::advance(r, rand() % left);
    //            std::swap(*first, *r);
    //            ++first;
    //            --left;
    //        }

    //        return first;
    //    }
    //}


    namespace algo
    {
        // Based on Floyd's algorithm for generating random numbers in range
        // Programming pearls: a sample of brilliance
        // Communications of the ACM
        // Volume 30 Issue 9, Sept. 1987
        // Pages 754-757
        template <typename random_generator_type, typename integral_type>
        void generate_unique_in_range(random_generator_type&             random_generator,
                                      std::unordered_set<integral_type>& result,
                                      const integral_type                low_inclusive,
                                      const integral_type                high_inclusive,
                                      const unsigned                     count)
        {
            result.clear();

            const auto diff = high_inclusive - low_inclusive + 1;

            for (integral_type i = diff - count; i < diff; ++i)
            {
                const auto t = std::uniform_int_distribution<integral_type>{0, i}(
                    random_generator) + low_inclusive;

                if (result.find(t) != result.end())
                {
                    result.insert(i + low_inclusive);
                }
                else
                {
                    result.insert(t);
                }
            }
        }
    }

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

            const genotype_type             genotype{};
            boost::optional<phenotype_type> phenotype{};
            boost::optional<double>         fitness{};
        };

        struct identity
        {
            template <typename T>
            T operator()(const T& t)
            {
                return t;
            }
        };

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


//        class crossover
//        {
//            public:
//                crossover(const unsigned num_crossover_points)
//                    : num_crossover_points_{num_crossover_points}
//                {
//                    crossover_points_.reserve(num_crossover_points);
//                }
//
//                template <typename genotype_type>
//                void operator(genotype_type& individual_a, genotype_type& individual_b)
//                {
//                    // generate crossover points
//                    //
//
//                }
//
//            private:
//                template <typename random_generator_type>
//                void generate_crossover_points(
//                    random_generator_type& random_generator,
//                    const unsigned         shortest_genome_length)
//                {
//                    crossover_points_.clear();
//
//                    // Floyd's algorithm for selecting 
//                    for (unsigned i = shortest_genome_length - crossover_points_ - 1;
//                         i < shortest_genome_length - 1;
//                         ++i)
//                    {
//                        const unsigned t = std::uniform_int_distribution<unsigned>{0U, i}(rng);
//
//                        if (res.find(r) != res.end())
//                        {
//                            res.insert(i);
//                        }
//                        else
//                        {
//                            res.insert(r);
//                        }
//                    }
//                }
//
//                unsigned num_crossover_points_{};
//                std::unordered_set<unsigned> crossover_points_{};
//        };

//        void
//        crossover(const individual_type& parent_a,
//                  const individual_type& parent_b,
//                  const std::size_t      crossover_points)
//        {
//
//        }

//        namespace reproduction
//        {
//            class sexual
//            {
//                public:
//                    sexual(const int crossover_points, const double mutation_rate)
//                        : crossover_points_{crossover_points}, mutation_rate_{mutation_rate} {}
//
//                    template <typename random_generator_type,
//                              typename parent_selector_type>
//                    operator(random_generator_type&        random_generator,
//                             parent_selector_type&         parent_selector,
//                             std::vector<individual_type>& population)
//                    {
//                        const auto& parent_a = parent_selector(random_generator);
//                        const auto& parent_b = parent_selector(random_generator);
//
//                        using namespace ::vi::ea::operators;
//
//                        crossover(parent_a, parent_b, crossover_points_);
//
//
//
//
//
//
//
//
//                        assert(parent_a);
//
//                        assert(parent_b);
//
//
//
//                    operator()(random_generator_type&        random_generator,
//                               std::vector<individual_type>& population)
//
//
//
//                    }
//            };
//        }

//        namespace adult_selection
//        {
//            class full_generational_replacement
//            {
//                public:
//                    template <typename random_generator_type,
//                              typename individual_type,
//                              typename child_generation_function_type,
//                              typename fitness_function_type>
//                    operator(random_generator_type&          random_generator,
//                             std::vector<individual_type>&   past_generation,
//                             std::vector<individual_type>&   next_generation,
//                             child_generation_function_type& child_generation_function,
//                             fitness_function_type&          fitness_function)
//                    {
//                        while (next_generation.size() < past_generation.size())
//                        {
//                            auto& new_children = child_generation_function(random_generator);
//
//                            for (auto& individual : new_children)
//                            {
//                                if (individual.develop(fitness_function))
//                                {
//                                    next_generation.insert_back(std::move(individual));
//                                }
//                            }
//                        }
//
//                        if (next_generation.size() > past_generation.size())
//                        {
//                            std::sort
//                        }
//
//                        for (auto& individual : next_generation)
//                        {
//
//                        }
//                    }
//            };
//        }

        namespace selection
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
                            if (individual.fitness)
                            {
                                fitness_sum += *individual.fitness;
                            }
                        }

                        random_fitness_distribution_ = std::uniform_real_distribution<double>{0.0, fitness_sum};
                    }

                private:
                    std::uniform_real_distribution<double> random_fitness_distribution_{};
            };
//            template <typename individual_type>
//            class fitness_proportionate
//            {
//                public:
//                    template <typename individual_type>
//                    typename individual_type::fitness_type
//                    expected_reproduction_value(const individual_type& individual)
//                    {
//                        return individual.fitness / population_fitness_mean_;
//                    }
//
//                    template <typename individual_input_iterator>
//                    void register_population(input_iterator first, input_iterator last)
//                    {
//                        using namespace boost::accumulators;
//                        accumulator_set<double, stats<tag::variance>> accumulator{};
//                        std::for_each(first, last, std::bind<void>(std::ref(accumulator), std::placeholders::_1));
//                        population_fitness_mean_ = mean(accumulator);
//                    }
//
//                private:
//                    typename individual_type::fitness_type population_fitness_mean_{};
//            };
//

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

        template <typename random_generator_type,
                  typename individual_type,
                  typename genotype_creator_type,
                  //typename development_function_type,
                  typename fitness_function_type>
        class system
        {
            public:
                system(
                    random_generator_type     random_generator,
                    genotype_creator_type     genotype_creator,
                    //development_function_type development_function,
                    fitness_function_type     fitness_function,
                    std::size_t               population_size)
                    : random_generator_{random_generator},
                      genotype_creator_{genotype_creator},
                      //development_function_{development_function},
                      fitness_function_{fitness_function},
                      population_size_{population_size}
                {
                    initialize_population();
                }

                void evolve()
                {
                    for (auto& individual : population_)
                    {
                        std::cout << "individual " << individual.genotype << " has fitness " << fitness_function_(individual.genotype) << std::endl;
                        //if (individual.phenotype = development_function_(individual.genotype))
                        //{
                        //    // The individual survived development! :)
                        //    individual.fitness = fitness_function_(individual);
                        //}
                    }


                }

            private:
                void initialize_population()
                {
                    population_.clear();
                    population_.reserve(population_size_);

                    for (std::size_t i = 0; i != population_size_; ++i)
                    {
                        population_.emplace_back(genotype_creator_(random_generator_));
                    }
                }

                random_generator_type        random_generator_{};
                genotype_creator_type        genotype_creator_{};
//                development_function_type    development_function_{};
                fitness_function_type        fitness_function_{};
                std::size_t                  population_size_{};

                std::vector<individual_type> population_{};
        };

        template <typename random_generator_type,
                  typename genotype_creator_type,
                  typename fitness_function_type>
        auto build_system(random_generator_type random_generator,
                          genotype_creator_type genotype_creator,
                          std::size_t           population_size,
                          fitness_function_type fitness_function)
        {
            return system<random_generator_type,
                          individual<typename genotype_creator_type::creation_type,
                                     typename genotype_creator_type::creation_type>,
                          genotype_creator_type,
                          fitness_function_type>(
                random_generator, genotype_creator, fitness_function, population_size);
        }
    }
}

template <class T>
void foo(T) {
    std::cout << "\n Short name: " << boost::typeindex::type_id<T>().raw_name();
    std::cout << "\n Readable name: " << boost::typeindex::type_id<T>().pretty_name();
}

int main()
{
    auto rng = std::default_random_engine{std::random_device{}()};
    auto creator = vi::ea::dynamic_bit_vector_creator{2, 5};

    auto system = vi::ea::build_system(
        rng, creator, 10,
        [] (const auto& genotype)
        {
            return static_cast<double>(genotype.count()) / static_cast<double>(genotype.size());
        });

    std::unordered_set<unsigned> res{};

    vi::algo::generate_unique_in_range(rng, res, 1U, 5U, 4);

    for (const auto& x : res)
    {
        std::cout << x << " ";
    }

    std::cout << std::endl;


//                static system build(random_generator_type random_generator,
//                                    genotype_creator_type genotype_creator,
//                                    fitness_function_type fitness_function,
//                                    std::size_t           population_size)

//    using individual_type = vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>;
//    std::vector<individual_type> population{
//        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)},
//        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)},
//        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)},
//        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)},
//        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)}};
//
//    population[0].fitness = 1.0;
//    population[1].fitness = 2.0;
//    population[2].fitness = 100.0;
//    population[3].fitness = 4.0;
//    population[4].fitness = 5.0;
//
//    for (const auto& individual : population)
//    {
//        std::cout << *individual.fitness << ": " << individual.genotype << std::endl;
//    }
//
//    auto selection = vi::ea::selection::fitness_proportionate{};
//    selection.register_population(population);
//
//    std::unordered_map<individual_type const*, int> histogram{};
//
//    //auto x = selection(rng, population);
//    //foo(&*x);
//
//    for (int i = 0; i != 1000; ++i)
//    {
//        auto x = selection(rng, population);
//        histogram[&*x] += 1;
//    }
//
//    for (auto x : histogram)
//    {
//        std::cout << "individual " << x.first->genotype << " (" << *x.first->fitness << ") count = " << x.second << std::endl;
//    }
}

