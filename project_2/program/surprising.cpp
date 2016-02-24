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
        vi::ea::dynamic_int_vector_creator{ \
            variables["L"].as<unsigned>(), \
            variables["L"].as<unsigned>(), \
            std::uniform_int_distribution<unsigned>{0U, variables["S"].as<unsigned>() - 1U}}, \
        PARENT_SELECTION, \
        vi::ea::reproduction::sexual{ \
            variables["mutation_rate"].as<double>(), \
            variables["crossover_points"].as<unsigned>()}, \
        ADULT_SELECTION, \
        variables["population_size"].as<unsigned>(), \
        [=] (const auto& genotype) \
        { \
            unsigned collisions = 0; \
            const int d_max = variables.count("global") ? genotype.size() / 2 : 0; \
            for (int d = 0; d <= d_max; ++d) \
            { \
                collisions += evaluate_surprising_sequence_collisions(genotype, variables["S"].as<unsigned>(), d); \
            } \
            return 1.0 / (1.0 + static_cast<double>(collisions)); \
        })

namespace po = boost::program_options;
po::variables_map variables{};

bool solution_found = false;

template <typename system_type>
void run_system(system_type&& system)
{
    unsigned generation;
    double fitness_mean, fitness_std_dev;
    typename system_type::individual_type const* best_individual;

    const auto early_stop = variables.count("stop") > 0;

    while (true)
    {
        std::tie(generation, fitness_mean, fitness_std_dev, best_individual) = system.stats();

        std::printf("%d %f %f %f %s\n",
                    generation,
                    best_individual->fitness,
                    fitness_mean,
                    fitness_std_dev,
                    boost::lexical_cast<std::string>(best_individual->genotype).c_str());

        if (early_stop and best_individual->fitness == 1.0 or generation >= variables["generations"].as<unsigned>())
        {
            break;
        }

        system.evolve();
    }
}

std::vector<bool> tags{};

unsigned evaluate_surprising_sequence_collisions(
    const std::vector<unsigned>& sentence, const unsigned s, const unsigned d)
{
    tags.resize(s * s);
    std::fill(tags.begin(), tags.end(), false);

    unsigned collisions = 0;

    for (std::size_t i = 0; i != sentence.size() - d - 1; ++i)
    {
        const auto offset = s * sentence[i] + sentence[i + d + 1];
        if (tags[offset])
        {
            ++collisions;
        }
        else
        {
            tags[offset] = true;
        }
    }

    return collisions;
}

int main(int argc, char** argv)
{
    try
    {
        po::options_description description{"Options"};
        description.add_options()
            ("L", po::value<unsigned>()->default_value(40), "Surprising string length")
            ("S", po::value<unsigned>()->default_value(40), "Surprising string symbol set size")
            ("adult_selection", po::value<std::string>()->default_value("full"), "Adult selection (full/mixed/over)")
            ("child_count", po::value<unsigned>()->default_value(150), "Child count used in mixed/over adult selection")
            ("crossover_points", po::value<unsigned>()->default_value(5), "Crossover points")
            ("epsilon", po::value<double>()->default_value(0.1), "Tournament probability of selecting random winner")
            ("generations", po::value<unsigned>()->default_value(1000), "Generation count")
            ("global", "Global surprising sequence")
            ("group_size", po::value<unsigned>()->default_value(10), "Tournament group size")
            ("local", "Local surprising sequence")
            ("mutation_rate", po::value<double>()->default_value(0.001), "Mutation rate")
            ("parent_selection", po::value<std::string>()->default_value("proportionate"), "Parent selection (proportionate/rank/sigma/tournament)")
            ("population_size", po::value<unsigned>()->default_value(100), "Population size")
            ("rank_max", po::value<double>()->default_value(1.5), "Rank selection pressure ('max')")
            ("stop", "Stop on first encountered solution");

        po::store(po::parse_command_line(argc, argv, description), variables);

        if (variables.count("global") == 0 and variables.count("local") == 0)
        {
            std::cerr << "error: use --global or --local switch" << std::endl;
            return EXIT_FAILURE;
        }

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

    return solution_found ? 1 : 0;
}

