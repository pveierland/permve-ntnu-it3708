#include <iostream>
#include <vi/ea.h>
#include <boost/program_options.hpp>

int main(int argc, char** argv)
{
    namespace po = boost::program_options;

    try
    {
        po::options_description description{"Options"};
        description.add_options()
            ("crossover_points", po::value<unsigned>()->default_value(5), "Crossover points")
            ("generations", po::value<unsigned>()->default_value(1000), "Generation count")
            ("mutation_rate", po::value<double>()->default_value(0.001), "Mutation rate")
            ("population_size", po::value<unsigned>()->default_value(100), "Population size")
            ("problem_size", po::value<unsigned>()->default_value(40), "Problem size");

        po::variables_map variables{};
        po::store(po::parse_command_line(argc, argv, description), variables);

        auto system = vi::ea::build_system(
            std::default_random_engine{std::random_device{}()},
            vi::ea::dynamic_bit_vector_creator{
                variables["problem_size"].as<unsigned>(),
                variables["problem_size"].as<unsigned>()},
            vi::ea::parent_selection::rank{1.5},
            vi::ea::reproduction::sexual{
                variables["mutation_rate"].as<double>(),
                variables["crossover_points"].as<unsigned>()},
            vi::ea::adult_selection::overproduction{150},
            variables["population_size"].as<unsigned>(),
            [] (const auto& genotype)
            {
                const bool leading_value = genotype[0];
                auto score = 1.0;

                for (boost::dynamic_bitset<>::size_type i = 1; i != genotype.size(); ++i)
                {
                    if (genotype[i] == leading_value)
                    {
                        ++score;
                    }
                    else
                    {
                        break;
                    }
                }

                return leading_value ? score : std::min(21.0, score);
            });

//            [] (const auto& genotype)
//            {
//                return static_cast<double>(genotype.count()) / static_cast<double>(genotype.size());
//            });

        std::cout << 0 << " " << system.mean_fitness() << " " << system.max_fitness() << std::endl;

        for (int generation = 1; generation < variables["generations"].as<unsigned>(); ++generation)
        {
            //double best_fitness = 0.0;

            //for (const auto& individual : system.current_generation_)
            //{
            //    if (individual.fitness == 1.0)
            //    {
            //        std::cout << "WINNER WINNER CHICKEN DINNER! generation = " << generation << ": " << individual.genotype << std::endl;
            //        return 0;
            //    }

            //    best_fitness = std::max(best_fitness, individual.fitness);
            //}

            //std::cout << "generation = " << generation << " best = " << best_fitness << std::endl;

            system.evolve();
            std::cout << generation << " " << system.mean_fitness() << " " << system.max_fitness() << std::endl;
        }

        std::cout << "WINNER: " << system.best_individual().genotype << std::endl;
    }
    catch (const po::error& error)
    {
        std::cerr << "error: " << error.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

