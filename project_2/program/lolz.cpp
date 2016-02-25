#include <vi/ea.h>

#include <boost/lexical_cast.hpp>
#include <boost/program_options.hpp>

#include <cstdio>
#include <iostream>
#include <random>
#include <string>

// Merciful C++ gods, please absolve me of these sins

#define BUILD_SYSTEM(PARENT_SELECTION, ADULT_SELECTION) \
    vi::ea::build_system( \
        std::default_random_engine{std::random_device{}()}, \
        vi::ea::dynamic_bit_vector_creator{ \
            variables["L"].as<unsigned>(), \
            variables["L"].as<unsigned>()}, \
        PARENT_SELECTION, \
        vi::ea::reproduction::sexual{ \
            variables["mutation_rate"].as<double>(), \
            variables["crossover_rate"].as<double>(), \
            variables["crossover_points"].as<unsigned>()}, \
        ADULT_SELECTION, \
        variables["population_size"].as<unsigned>(), \
        [=] (const auto& genotype) \
        { \
            const bool leading_value = genotype[0]; \
            auto score = 1U; \
            for (vi::ea::dynamic_bit_vector::size_type i = 1; i != genotype.size(); ++i) \
            { \
                if (genotype[i] == leading_value) \
                { \
                    ++score; \
                } \
                else \
                { \
                    break; \
                } \
            } \
            return static_cast<double>( \
                leading_value ? score : std::min(variables["Z"].as<unsigned>(), score)); \
        })

namespace po = boost::program_options;
po::variables_map variables{};

template <typename system_type>
void run_system(system_type&& system)
{
    unsigned generation;
    double fitness_mean, fitness_std_dev;
    typename system_type::individual_type const* best_individual;

    while (true)
    {
        std::tie(generation, fitness_mean, fitness_std_dev, best_individual) = system.stats();

        std::printf("%d %f %f %f %s\n",
                    generation,
                    best_individual->fitness,
                    fitness_mean,
                    fitness_std_dev,
                    boost::lexical_cast<std::string>(best_individual->genotype).c_str());

        if (generation >= variables["generations"].as<unsigned>())
        {
            break;
        }

        system.evolve();
    }
}

int main(int argc, char** argv)
{
    try
    {
        po::options_description description{"Options"};
        description.add_options()
            ("L", po::value<unsigned>()->default_value(40U), "String length")
            ("Z", po::value<unsigned>()->default_value(1U), "Leading zeros score cap")
            ("adult_selection", po::value<std::string>()->default_value("full"), "Adult selection (full/mixed/over)")
            ("child_count", po::value<unsigned>()->default_value(150), "Child count used in mixed/over adult selection")
            ("crossover_points", po::value<unsigned>()->default_value(1), "Crossover points")
            ("crossover_rate", po::value<double>()->default_value(1.0), "Crossover rate")
            ("epsilon", po::value<double>()->default_value(0.1), "Tournament probability of selecting random winner")
            ("generations", po::value<unsigned>()->default_value(1000), "Generation count")
            ("group_size", po::value<unsigned>()->default_value(10), "Tournament group size")
            ("mutation_rate", po::value<double>()->default_value(0.001), "Mutation rate")
            ("parent_selection", po::value<std::string>()->default_value("proportionate"), "Parent selection (proportionate/rank/sigma/tournament)")
            ("population_size", po::value<unsigned>()->default_value(100), "Population size")
            ("random_target", "Random target string")
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

