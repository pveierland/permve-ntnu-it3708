#include <vi/ea.h>
#include <boost/program_options.hpp>
#include <iostream>

// Merciful C++ gods, please absolve me of these sins

#define BUILD_SYSTEM(PARENT_SELECTION, ADULT_SELECTION) \
    vi::ea::build_system( \
        std::default_random_engine{std::random_device{}()}, \
        vi::ea::dynamic_bit_vector_creator{ \
            variables["problem_size"].as<unsigned>(), \
            variables["problem_size"].as<unsigned>()}, \
        PARENT_SELECTION, \
        vi::ea::reproduction::sexual{ \
            variables["mutation_rate"].as<double>(), \
            variables["crossover_points"].as<unsigned>()}, \
        ADULT_SELECTION, \
        variables["population_size"].as<unsigned>(), \
        [] (const auto& genotype) \
        { \
            return static_cast<double>(genotype.count()) / static_cast<double>(genotype.size()); \
        })

namespace po = boost::program_options;
po::variables_map variables{};

template <typename system_type>
void run_system(system_type&& system)
{
    std::cout << 0 << " " << system.mean_fitness() << " " << system.max_fitness() << std::endl;

    for (int generation = 1; generation < variables["generations"].as<unsigned>(); ++generation)
    {
        system.evolve();
        std::cout << generation << " " << system.mean_fitness() << " " << system.max_fitness() << std::endl;
    }

    std::cout << "WINNER: " << system.best_individual().genotype << std::endl;
}

int main(int argc, char** argv)
{
    try
    {
        po::options_description description{"Options"};
        description.add_options()
            ("adult_selection", po::value<std::string>()->default_value("full"), "Adult selection (full/mixed/over)")
            ("child_count", po::value<unsigned>()->default_value(150), "Child count used in mixed/over adult selection")
            ("crossover_points", po::value<unsigned>()->default_value(5), "Crossover points")
            ("generations", po::value<unsigned>()->default_value(1000), "Generation count")
            ("mutation_rate", po::value<double>()->default_value(0.001), "Mutation rate")
            ("parent_selection", po::value<std::string>()->default_value("proportionate"), "Parent selection (proportionate/rank/sigma/tournament)")
            ("population_size", po::value<unsigned>()->default_value(100), "Population size")
            ("problem_size", po::value<unsigned>()->default_value(40), "Problem size")
            ("rank_max", po::value<double>()->default_value(1.5), "Rank selection pressure ('max')");

        po::store(po::parse_command_line(argc, argv, description), variables);

        const auto adult_selection  = variables["adult_selection"].as<std::string>();
        const auto parent_selection = variables["parent_selection"].as<std::string>();

        if (adult_selection == "full" and parent_selection == "proportionate")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::fitness_proportionate{},
                vi::ea::adult_selection::full_generational_replacement{}));
        }
        else if (adult_selection == "full" and parent_selection == "rank")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::rank{variables["rank_max"].as<double>()},
                vi::ea::adult_selection::full_generational_replacement{}));
        }
        else if (adult_selection == "full" and parent_selection == "sigma")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::sigma{},
                vi::ea::adult_selection::full_generational_replacement{}));
        }
        else if (adult_selection == "full" and parent_selection == "tournament")
        {
            auto parent_selection = vi::ea::parent_selection::tournament{
                variables["group_size"].as<unsigned>(),
                variables["epsilon"].as<double>()};

            run_system(BUILD_SYSTEM(parent_selection, vi::ea::adult_selection::full_generational_replacement{}));
        }
        else if (adult_selection == "mixed" and parent_selection == "proportionate")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::fitness_proportionate{},
                vi::ea::adult_selection::generational_mixing{variables["child_count"].as<unsigned>()}));
        }
        else if (adult_selection == "mixed" and parent_selection == "rank")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::rank{variables["rank_max"].as<double>()},
                vi::ea::adult_selection::generational_mixing{variables["child_count"].as<unsigned>()}));
        }
        else if (adult_selection == "mixed" and parent_selection == "sigma")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::sigma{},
                vi::ea::adult_selection::generational_mixing{variables["child_count"].as<unsigned>()}));
        }
        else if (adult_selection == "mixed" and parent_selection == "tournament")
        {
            auto parent_selection = vi::ea::parent_selection::tournament{
                variables["group_size"].as<unsigned>(),
                variables["epsilon"].as<double>()};

            run_system(BUILD_SYSTEM(
                parent_selection,
                vi::ea::adult_selection::generational_mixing{variables["child_count"].as<unsigned>()}));
        }
        else if (adult_selection == "over" and parent_selection == "proportionate")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::fitness_proportionate{},
                vi::ea::adult_selection::overproduction{variables["child_count"].as<unsigned>()}));
        }
        else if (adult_selection == "over" and parent_selection == "rank")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::rank{variables["rank_max"].as<double>()},
                vi::ea::adult_selection::overproduction{variables["child_count"].as<unsigned>()}));
        }
        else if (adult_selection == "over" and parent_selection == "sigma")
        {
            run_system(BUILD_SYSTEM(
                vi::ea::parent_selection::sigma{},
                vi::ea::adult_selection::overproduction{variables["child_count"].as<unsigned>()}));
        }
        else if (adult_selection == "over" and parent_selection == "tournament")
        {
            auto parent_selection = vi::ea::parent_selection::tournament{
                variables["group_size"].as<unsigned>(),
                variables["epsilon"].as<double>()};

            run_system(BUILD_SYSTEM(
                parent_selection,
                vi::ea::adult_selection::overproduction{variables["child_count"].as<unsigned>()}));
        }
    }
    catch (const po::error& error)
    {
        std::cerr << "error: " << error.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

