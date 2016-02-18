#include <algorithm>
#include <cassert>
#include <functional>
#include <iostream>
#include <random>
#include <vector>

#include <boost/accumulators/accumulators.hpp>
#include <boost/accumulators/statistics/mean.hpp>
#include <boost/accumulators/statistics/variance.hpp>
#include <boost/dynamic_bitset.hpp>
#include <boost/optional.hpp>

namespace vi
{
    namespace algo
    {
        template <class bidirectional_iterator>
        bidirectional_iterator random_unique(
            bidirectional_iterator first, bidirectional_iterator last, std::size_t num_random)
        {
            const auto left = std::distance(first, last);

            while (num_random--)
            {
                auto r = first;
                std::advance(r, rand() % left);
                std::swap(*first, *r);

            }
        }
                                                bidiiter r = first;
                                                        std::advance(r, rand()%left);
                                                                std::swap(*first, *r);n
                                                                        ++first;
                                                                                --left;
                                                                                    }
                                        return first;
                        }
    }

    namespace ea
    {
        template <typename genotype_t,
                  typename phenotype_t,
                  typename fitness_t>
        struct individual
        {
            using genotype_type  = genotype_t;
            using phenotype_type = phenotype_t;
            using fitness_type   = fitness_t;

            individual(const genotype_type& genotype)
                : genotype{genotype} {}

            const genotype_type             genotype{};
            boost::optional<phenotype_type> phenotype{};
            boost::optional<fitness_type>   fitness{};
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

        namespace selection
        {
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
//            class fitness_proportionate
//            {
//                public:
//
//
//            }

            class tournament
            {
                public:
                    tournament(const std::size_t group_size, const double epsilon)
                        : group_size_{group_size},
                          select_best_individual_distribution_{1.0 - epsilon} {}

                    template <typename random_generator_type, typename individual_type>
                    const individual_type&
                    operator()(random_generator_type& random_generator, const std::vector<individual_type>& population)
                    {
                        const bool select_best = select_best_individual_distribution_(random_generator);

                        if (select_best)
                        {
                            for (int i = 0; i != group_size_; ++i)
                            {
                                const auto random_individual_index = select_random_individual_distribution_(random_generator);

                            }




                            const auto best_individual_iterator = std::max_element(
                                population.begin(), population.end(),
                                [](const individual_type& a, const individual_type& b)
                                {
                                    return a.fitness < b.fitness;
                                });

                            return *best_individual_iterator;
                        }
                        else
                        {
                            const auto random_individual_index = select_random_individual_distribution_(random_generator);
                            return population[random_individual_index];
                        }
                    }


                     


                    template <typename individual_type>
                    void register_population(const std::vector<individual_type>& population)
                    {
                        assert(population.size() > 1);
                        select_random_individual_distribution_ = std::uniform_int_distribution<std::size_t>{0, population.size() - 1};
                    }

                private:
                    std::size_t                                group_size_{};
                    std::bernoulli_distribution                select_best_individual_distribution_{};
                    std::uniform_int_distribution<std::size_t> select_random_individual_distribution_{};
            };
        }

//        template <typename individual_type,
//                  typename random_generator_type,
//                  typename genotype_creator_type,
//                  typename development_function_type,
//                  typename fitness_function_type>
//        class system
//        {
//            public:
//                using genotype_type = typename individual_type::genotype_type;
//                using phenotype_type = typename individual_type::phenotype_type;
//                using fitness_type = typename individual_type::fitness_type;
//
//                system(
//                    random_generator_type&    random_generator,
//                    genotype_creator_type     genotype_creator,
//                    development_function_type development_function,
//                    fitness_function_type     fitness_function,
//                    std::size_t               population_size)
//                    : random_generator_{random_generator},
//                      genotype_creator_{genotype_creator},
//                      development_function_{development_function},
//                      fitness_function_{fitness_function},
//                      population_size_{population_size}
//                {
//                    initialize_population();
//                }
//
//                void evolve()
//                {
//                    for (auto& individual : population_)
//                    {
//                        if (individual.phenotype = development_function_(individual.genotype))
//                        {
//                            // The individual survived development! :)
//                            individual.fitness = fitness_function_(individual);
//                        }
//                    }
//                }
//
//            private:
//                void initialize_population()
//                {
//                    population_.clear();
//                    population_.reserve(population_size_);
//
//                    for (std::size_t i = 0; i != population_size_; ++i)
//                    {
//                        population_.emplace_back(creation_function_(random_generator_));
//                    }
//                }
//
//                random_generator_type&       random_generator_{};
//                genotype_creator_type        genotype_creator_{};
//                development_function_type    development_function_{};
//                fitness_function_type        fitness_function_{};
//                std::size_t                  population_size_{};
//
//                std::vector<individual_type> population_{};
//        };
    }
}

int main()
{
    auto rng = std::default_random_engine{std::random_device{}()};
    auto creator = vi::ea::dynamic_bit_vector_creator{2, 5};

    using individual_type = vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>;
    std::vector<individual_type> population{
        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)},
        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)},
        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)},
        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)},
        vi::ea::individual<boost::dynamic_bitset<>, boost::dynamic_bitset<>, double>{creator(rng)}};

    for (const auto& individual : population)
    {
        std::cout << individual.genotype << std::endl;
    }

    population[0].fitness = 1.0;
    population[1].fitness = 2.0;
    population[2].fitness = 8.0;
    population[3].fitness = 4.0;
    population[4].fitness = 5.0;

    auto selection = vi::ea::selection::tournament{5, 0.5};

    selection.register_population(population);

    auto x = selection(rng, population);

    std::cout << "THE VERY BEST ->" << std::endl << x.genotype << std::endl;



//    vi::ea::selection::tournament{
//
//
//            template <typename individual_type>
//            class tournament

//    auto ones = vi::ea::system<
//        double, boost::dynamic_bitset, boost::dynamic_bitset>{};
//
//    ones.evolve();
}

