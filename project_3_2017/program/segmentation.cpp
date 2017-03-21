#include <csignal>
#include <fstream>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

#include <boost/format.hpp>
#include <boost/gil/gil_all.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/optional.hpp>
#include <boost/program_options.hpp>

#include <QApplication>

#include <vi_ea_nsga2.hpp>
#include <vi_image_segmentation.hpp>

#include <termcolor.hpp>

volatile bool run_program = true;

template <typename solver_type>
void
print_evolution_info(
    const solver_type&                                                                                      solver,
    const unsigned                                                                                          generation,
    const unsigned                                                                                          objective_count,
    const std::vector<std::string>                                                                          objective_names,
    const std::vector<unsigned>&                                                                            segmentation_count_hints,
    const std::vector<std::vector<vi::ea::nsga2::individual<vi::image_segmentation::moea::genotype_type>>>& cherrypick_solutions,
    const int                                                                                               cherrypick_boundary_best)
{
    std::cout << boost::format(
        "Generation %u: ")
        % generation;

    for (unsigned objective_value_index = 0U;
         objective_value_index < objective_count;
         ++objective_value_index)
    {
        const auto individual = solver.extreme_min[objective_value_index];
        std::cout << boost::format(
            "Best %s: %.2f")
            % objective_names[objective_value_index].c_str()
            % individual->objective_values[objective_value_index];

        if (objective_count > 1)
        {
            std::cout << " (";
            bool first_inside = true;

            for (unsigned other_objective_value_index = 0U;
                 other_objective_value_index < objective_count;
                 ++other_objective_value_index)
            {
                if (other_objective_value_index != objective_value_index)
                {
                    std::cout << boost::format(
                        "%s%s=%.2f")
                        % (first_inside ? "" : " ")
                        % objective_names[other_objective_value_index].c_str()
                        % individual->objective_values[other_objective_value_index];

                    first_inside = false;
                }
            }

            std::cout << ") ";
        }
    }

    if (!cherrypick_solutions.empty())
    {
        for (unsigned hint_index = 0; hint_index < segmentation_count_hints.size(); ++hint_index)
        {
            const auto& cherrypick_solutions_hint = cherrypick_solutions[hint_index];
            if (!cherrypick_solutions_hint.empty())
            {
                const auto  hint     = static_cast<int>(segmentation_count_hints[hint_index]);
                const auto  distance = std::abs(static_cast<int>(cherrypick_solutions_hint[0].genotype.second) - hint);

                if (distance <= cherrypick_boundary_best)
                {
                    std::cout << termcolor::green << "\u2764" << termcolor::reset;
                }
                else
                {
                    std::cout << termcolor::blue << "\u25B2" << termcolor::reset;
                }
            }
            else
            {
                std::cout << termcolor::red << "\u274C" << termcolor::reset;
            }
        }
    }

    std::cout << std::endl;
}

template <typename solver_type>
void
save_population(const std::string&                  filename,
                const solver_type&                  solver,
                const vi::image_segmentation::moea& problem,
                const unsigned                      objective_count,
                const std::vector<std::string>      objective_names)
{
    std::ofstream output_file{filename.c_str()};

    output_file << "#individual_index individual_rank segment_count";

    for (const auto& objective_name : objective_names)
    {
        output_file << ' ' << objective_name;
    }

    output_file << std::endl;

    auto individual_index = 0U;

    for (const auto& individual : solver.current_population)
    {
        output_file << boost::format("%u %u %u")
            % individual_index
            % individual.rank
            % individual.genotype.second;

        for (unsigned objective_value_index = 0U;
             objective_value_index < objective_count;
             ++objective_value_index)
        {
            output_file << boost::format(" %.5f") % individual.objective_values[objective_value_index];
        }

        output_file << std::endl;

        ++individual_index;
    }
}

template <typename solver_type>
void
update_cherrypicked_solutions(
    const solver_type&                                                                                solver,
    const std::vector<unsigned>&                                                                      segmentation_count_hints,
    std::vector<std::vector<vi::ea::nsga2::individual<vi::image_segmentation::moea::genotype_type>>>& cherrypick_solutions,
    const int                                                                                         cherrypick_boundary_worst,
    const unsigned                                                                                    cherrypick_count)
{
    if (!cherrypick_solutions.empty())
    {
        for (const auto& individual : solver.current_population)
        {
            const auto individual_segmentation_count = individual.genotype.second;

            for (unsigned hint_index = 0; hint_index < segmentation_count_hints.size(); ++hint_index)
            {
                const auto  hint     = static_cast<int>(segmentation_count_hints[hint_index]);
                const auto  distance = std::abs(static_cast<int>(individual_segmentation_count) - hint);

                auto& cherrypick_solutions_hint = cherrypick_solutions[hint_index];

                if (distance <= cherrypick_boundary_worst)
                {
                    if (cherrypick_solutions_hint.size() >= cherrypick_count)
                    {
                        const auto& other          = cherrypick_solutions_hint[cherrypick_count - 1];
                        const auto  other_distance = std::abs(static_cast<int>(other.genotype.second) - hint);

                        if (distance < other_distance and vi::ea::nsga2::dominates(individual.objective_values, other.objective_values))
                        {
                            cherrypick_solutions_hint.pop_back();
                            cherrypick_solutions_hint.push_back(individual);
                        }
                    }
                    else
                    {
                        cherrypick_solutions_hint.push_back(individual);

                        std::sort(cherrypick_solutions_hint.begin(), cherrypick_solutions_hint.end(),
                            [hint](const auto& a, const auto& b)
                            {
                                const auto distance_a = std::abs(static_cast<int>(a.genotype.second) - hint);
                                const auto distance_b = std::abs(static_cast<int>(b.genotype.second) - hint);

                                return ((distance_a < distance_b) or
                                    ((distance_a == distance_b) and
                                     (vi::ea::nsga2::dominates(a.objective_values, b.objective_values))));
                            });
                    }
                }
            }
        }
    }
}

int
main(int argc, char** argv)
{
    namespace po = boost::program_options;

    std::signal(SIGINT, [](int /*signal*/) { run_program = false; });

    int arg_count = 3;
    auto arg0     = "application";
    auto arg1     = "-platform";
    auto arg2     = "offscreen";
    char* args[]  = {const_cast<char*>(arg0), const_cast<char*>(arg1), const_cast<char*>(arg2)};

    QApplication app{arg_count, args};

    try
    {
        po::options_description options{"Options"};
        options.add_options()
            ("cherrypick_boundary_best",      po::value<int>()->default_value(2),                        "Best required segmentation count distance between hint and solution")
            ("cherrypick_boundary_worst",     po::value<int>()->default_value(7),                        "Worst allowed segmentation count distance between hint and solution")
            ("cherrypick_count",              po::value<unsigned>()->default_value(5),                   "Cherrypick solution count")
            ("crossover_rate",                po::value<double>()->default_value(1.0),                   "Crossover rate")
            ("evaluate_connectivity_measure", po::value<bool>()->default_value(true),                    "Evaluate connectivity measure")
            ("evaluate_edge_value",           po::value<bool>()->default_value(true),                    "Evaluate edge value")
            ("evaluate_overall_deviation",    po::value<bool>()->default_value(true),                    "Evaluate overall deviation")
            ("generations",                   po::value<unsigned>()->default_value(1000),                "Generation count")
            ("hint",                          po::value<std::vector<unsigned>>()->multitoken(),          "Segment count hints")
            ("input_image_filename",          po::value<std::string>()->required(),                      "Input image filename")
            ("mutation_rate",                 po::value<double>()->default_value(0.05),                  "Mutation rate")
            ("population_size",               po::value<unsigned>()->default_value(100),                 "Population size")
            ("render",                        po::value<bool>()->default_value(true),                    "Render solutions")
            ("save",                          po::value<bool>()->default_value(true),                    "Save population information to file")
            ("save_filename",                 po::value<std::string>()->default_value("population.txt"), "Population filename")
            ("tournament_group_size",         po::value<unsigned>()->default_value(5),                   "Tournament group size")
            ("tournament_randomness",         po::value<double>()->default_value(0.1),                   "Tournament probability of selecting random winner");

        po::positional_options_description positional_options{};
        positional_options.add("input_image_filename", 1);

        po::variables_map variables{};
        po::store(po::command_line_parser(argc, argv).options(options).positional(positional_options).run(), variables);
        po::notify(variables);

        const auto segmentation_count_hints =
            variables["hint"].empty() ? std::vector<unsigned>{} : variables["hint"].as<std::vector<unsigned>>();

        std::vector<std::vector<vi::ea::nsga2::individual<vi::image_segmentation::moea::genotype_type>>>
            cherrypick_solutions(segmentation_count_hints.size());

        const auto cherrypick_boundary_best  = variables["cherrypick_boundary_best"].as<int>();
        const auto cherrypick_boundary_worst = variables["cherrypick_boundary_worst"].as<int>();
        const auto cherrypick_count          = variables["cherrypick_count"].as<unsigned>();

        const auto objective_count =
            (variables["evaluate_overall_deviation"].as<bool>()    ? 1U : 0U) +
            (variables["evaluate_edge_value"].as<bool>()           ? 1U : 0U) +
            (variables["evaluate_connectivity_measure"].as<bool>() ? 1U : 0U);

        vi::ea::nsga2::options solver_options{
            variables["crossover_rate"].as<double>(),
            variables["mutation_rate"].as<double>(),
            objective_count,
            variables["population_size"].as<unsigned>(),
            variables["tournament_group_size"].as<unsigned>(),
            variables["tournament_randomness"].as<double>()
        };

        auto rng{std::default_random_engine{std::random_device{}()}};

        vi::image_segmentation::moea problem{
            variables["input_image_filename"].as<std::string>(),
            variables["evaluate_overall_deviation"].as<bool>(),
            variables["evaluate_edge_value"].as<bool>(),
            variables["evaluate_connectivity_measure"].as<bool>()};

        using namespace std::placeholders;

        auto solver = vi::ea::nsga2::build_system<vi::image_segmentation::moea::genotype_type>(
            rng,
            solver_options,
            std::bind(&vi::image_segmentation::moea::generate<decltype(rng)>, &problem, _1),
            std::bind(&vi::image_segmentation::moea::evaluate, &problem, _1),
            std::bind(&vi::image_segmentation::moea::crossover_operator<decltype(rng)>, _1, _2, _3),
            std::bind(&vi::image_segmentation::moea::mutate_operator<decltype(rng)>, _1, _2));

        const auto generations = variables["generations"].as<unsigned>();

        std::vector<std::string> objective_names{};
        if (variables["evaluate_overall_deviation"].as<bool>())
        {
            objective_names.push_back("deviation");
        }
        if (variables["evaluate_edge_value"].as<bool>())
        {
            objective_names.push_back("edge");
        }
        if (variables["evaluate_connectivity_measure"].as<bool>())
        {
            objective_names.push_back("connectivity");
        }

        for (auto generation = 1U; run_program && generation <= generations; ++generation)
        {
            solver.evolve(rng);
            update_cherrypicked_solutions(solver, segmentation_count_hints, cherrypick_solutions, cherrypick_boundary_worst, cherrypick_count);
            print_evolution_info(solver, generation, objective_count, objective_names, segmentation_count_hints, cherrypick_solutions, cherrypick_boundary_best);
        }

        solver.fast_non_dominated_sort();

        if (variables["save"].as<bool>())
        {
            save_population(variables["save_filename"].as<std::string>(),
                            solver,
                            problem,
                            objective_count,
                            objective_names);
        }

        if (variables["render"].as<bool>())
        {
            auto solution_index = 0;
            auto hint_index = 0;

            while (solution_index < cherrypick_count and hint_index < cherrypick_count * segmentation_count_hints.size())
            {
                const auto& cherrypick_solutions_hint  = cherrypick_solutions[hint_index % cherrypick_solutions.size()];
                const auto  cherrypick_solutions_index = hint_index / cherrypick_solutions.size();

                if (cherrypick_solutions_index < cherrypick_solutions_hint.size())
                {
                    const auto& cherrypicked_solution = cherrypick_solutions_hint[cherrypick_solutions_index];

                    std::ostringstream description{};

                    description << boost::format("_solution_%u_segments_%u")
                        % (solution_index + 1) % cherrypicked_solution.genotype.second;

                    for (unsigned objective_value_index = 0U;
                         objective_value_index < objective_count;
                         ++objective_value_index)
                    {
                        description << boost::format("_%s_%.5f")
                            % objective_names[objective_value_index].c_str()
                            % cherrypicked_solution.objective_values[objective_value_index];
                    }

                    std::vector<vi::image_segmentation::segment_index> segmentation{};
                    vi::image_segmentation::segment_index              segment_count{};

                    std::tie(segmentation, segment_count) =
                        vi::image_segmentation::compile_segmentation_graph(
                            cherrypicked_solution.genotype.first,
                            problem.input_image_width,
                            problem.input_image_height);

                    const auto description_str = description.str();

                    vi::image_segmentation::render(
                        boost::gil::view(problem.input_image),
                        segmentation,
                        boost::str(boost::format("render_type_1%s.pdf") % description_str.c_str()),
                        true,
                        true,
                        false);

                    vi::image_segmentation::render(
                        boost::gil::view(problem.input_image),
                        segmentation,
                        boost::str(boost::format("render_type_2%s.pdf") % description_str.c_str()),
                        false,
                        true,
                        false);

                    vi::image_segmentation::render(
                        boost::gil::view(problem.input_image),
                        segmentation,
                        boost::str(boost::format("render_type_3%s.pdf") % description_str.c_str()),
                        false,
                        false,
                        true);

                    ++solution_index;
                }

                ++hint_index;
            }
        }
    }
    catch (const po::error& error)
    {
        std::cerr << "error: " << error.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
