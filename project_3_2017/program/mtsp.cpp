#include <algorithm>
#include <fstream>
#include <functional>
#include <iostream>
#include <numeric>
#include <random>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include <boost/algorithm/string.hpp>
#include <boost/format.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/numeric/ublas/io.hpp>
#include <boost/numeric/ublas/matrix.hpp>
#include <boost/program_options.hpp>

#include <vi_ea_nsga2.hpp>
#include <vi_algo.hpp>

namespace vi
{
    namespace ea
    {
        struct mtsp
        {
            template <typename random_generator_type>
            static
            std::pair<std::vector<int>, std::vector<int>>
            crossover_sequence_ox(random_generator_type&  random_generator,
                                  const std::vector<int>& parent_sequence_a,
                                  const std::vector<int>& parent_sequence_b)
            {
                const auto sequence_length = static_cast<int>(parent_sequence_a.size());

                auto children = std::make_pair(
                    std::vector<int>(sequence_length, -1),
                    std::vector<int>(sequence_length, -1));

                auto& child_sequence_a = children.first;
                auto& child_sequence_b = children.second;

                auto distribution = std::uniform_int_distribution<int>(0, sequence_length - 1U);
                const auto first  = distribution(random_generator);
                const auto second = distribution(random_generator);
                const auto left   = std::min(first, second);
                const auto right  = std::max(first, second);

                for (auto m = left; m <= right; ++m)
                {
                    child_sequence_a[m] = parent_sequence_a[m];
                    child_sequence_b[m] = parent_sequence_b[m];
                }

                auto m   = (right + 1) % sequence_length;
                auto n_a = m;
                auto n_b = m;

                while (m != left)
                {
                    while (std::find(child_sequence_b.begin(), child_sequence_b.end(), parent_sequence_a[n_a]) != child_sequence_b.end())
                    {
                        n_a = (n_a + 1) % sequence_length;
                    }

                    while (std::find(child_sequence_a.begin(), child_sequence_a.end(), parent_sequence_b[n_b]) != child_sequence_a.end())
                    {
                        n_b = (n_b + 1) % sequence_length;
                    }

                    child_sequence_b[m] = parent_sequence_a[n_a];
                    child_sequence_a[m] = parent_sequence_b[n_b];

                    m = (m + 1) % sequence_length;
                }

                return children;
            }

            template <typename random_generator_type>
            static
            void
            mutate_sequence(random_generator_type& random_generator,
                            std::vector<int>&      sequence)
            {
                const auto sequence_length = static_cast<int>(sequence.size());
                auto distribution = std::uniform_int_distribution<int>(0, sequence_length - 1U);
                const auto a = distribution(random_generator);
                const auto b = distribution(random_generator);
                std::swap(sequence[a], sequence[b]);
            }

            static
            boost::numeric::ublas::matrix<double>
            read_file(const std::string& filename)
            {
                std::ifstream input{filename};

                std::string              line{};
                std::vector<std::string> parts{};

                if (!std::getline(input, line))
                {
                    throw std::runtime_error("read_file: missing header");
                }

                boost::split(parts, line, boost::is_any_of(","), boost::token_compress_on);

                const auto num_cities = static_cast<int>(parts.size()) - 1;

                boost::numeric::ublas::matrix<double> values(num_cities, num_cities);

                for (auto i = 0; i != num_cities; ++i)
                {
                    if (!std::getline(input, line))
                    {
                        throw std::runtime_error("read_file: missing input");
                    }

                    parts.clear();
                    boost::split(parts, line, boost::is_any_of("\r\n ,"), boost::token_compress_on);

                    for (auto j = 0; j <= i; ++j)
                    {
                        const auto value = boost::lexical_cast<double>(parts[j + 1]);
                        values(i, j) = value;
                        values(j, i) = value;
                    }
                }

                return values;
            }

            boost::numeric::ublas::matrix<double> costs{};
            boost::numeric::ublas::matrix<double> distances{};
            unsigned                              num_cities{};

            mtsp(const std::string& cost_filename,
                 const std::string& distance_filename)
                : costs{read_file(cost_filename)},
                  distances{read_file(distance_filename)},
                  num_cities{static_cast<unsigned>(costs.size1())}
            {
            }

            std::vector<double>
            evaluate_sequence(const std::vector<int>& sequence)
            {
                auto distance = 0.0;
                auto cost     = 0.0;

                auto from_city_id = sequence[0];

                for (std::size_t i = 1; i != sequence.size(); ++i)
                {
                    const auto to_city_id = sequence[i];

                    distance += distances(from_city_id, to_city_id);
                    cost     += costs(from_city_id, to_city_id);

                    from_city_id = to_city_id;
                }

                distance += distances(from_city_id, sequence[0]);
                cost     += costs(from_city_id, sequence[0]);

                return std::vector<double>{distance, cost};
            }

            template <typename random_generator_type>
            std::vector<int>
            generate_sequence(random_generator_type& random_generator)
            {
                std::vector<int> sequence(num_cities);
                std::iota(sequence.begin(), sequence.end(), 0);
                std::shuffle(sequence.begin(), sequence.end(), random_generator);
                return sequence;
            }
        };
    }
}

int
main(int argc, char** argv)
{
    namespace po = boost::program_options;

    try
    {
        po::options_description description{"Options"};
        description.add_options()
            ("crossover_rate",        po::value<double>()->default_value(1.0),    "Crossover rate")
            ("generations",           po::value<unsigned>()->default_value(200),  "Generation count")
            ("mutation_rate",         po::value<double>()->default_value(0.05),   "Mutation rate")
            ("population_size",       po::value<unsigned>()->default_value(1000), "Population size")
            ("tournament_group_size", po::value<unsigned>()->default_value(20),  "Tournament group size")
            ("tournament_randomness", po::value<double>()->default_value(0.1),    "Tournament probability of selecting random winner");

        po::variables_map variables{};
        po::store(po::parse_command_line(argc, argv, description), variables);

        vi::ea::nsga2::options solver_options{
            variables["crossover_rate"].as<double>(),
            variables["mutation_rate"].as<double>(),
            2U,
            variables["population_size"].as<unsigned>(),
            variables["tournament_group_size"].as<unsigned>(),
            variables["tournament_randomness"].as<double>()
        };

        auto rng{std::default_random_engine{std::random_device{}()}};
        vi::ea::mtsp problem{"../../project_5/data/cost.csv", "../../project_5/data/distance.csv"};

        using genotype_type = std::vector<int>;
        using namespace std::placeholders;

        auto solver = vi::ea::nsga2::build_system<genotype_type>(
            rng,
            solver_options,
            std::bind(&vi::ea::mtsp::generate_sequence<decltype(rng)>, &problem, _1),
            std::bind(&vi::ea::mtsp::evaluate_sequence, &problem, _1),
            std::bind(&vi::ea::mtsp::crossover_sequence_ox<decltype(rng)>, _1, _2, _3),
            std::bind(&vi::ea::mtsp::mutate_sequence<decltype(rng)>, _1, _2));

        const auto generations = variables["generations"].as<unsigned>();

        for (auto generation = 1U; generation <= generations; ++generation)
        {
            solver.evolve(rng);

            std::cout << boost::format(
                "Generation %u: Best distance %.2f (cost %.2f), Best cost %.2f (distance %.2f)")
                % generation
                % solver.extreme_min[0]->objective_values[0]
                % solver.extreme_min[0]->objective_values[1]
                % solver.extreme_min[1]->objective_values[1]
                % solver.extreme_min[1]->objective_values[0]
                << std::endl;
        }
    }
    catch (const po::error& error)
    {
        std::cerr << "error: " << error.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

