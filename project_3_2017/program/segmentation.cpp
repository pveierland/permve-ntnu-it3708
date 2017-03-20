#include <csignal>
#include <functional>
#include <iostream>
#include <string>
#include <vector>

#include <boost/format.hpp>
#include <boost/gil/gil_all.hpp>
#include <boost/lexical_cast.hpp>
#include <boost/program_options.hpp>

#include <QApplication>

#include <vi_ea_nsga2.hpp>
#include <vi_image_segmentation.hpp>

volatile bool run_program = true;

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
            ("crossover_rate",                po::value<double>()->default_value(1.0),    "Crossover rate")
            ("evaluate_connectivity_measure", po::value<bool>()->default_value(true),     "Evaluate connectivity measure")
            ("evaluate_edge_value",           po::value<bool>()->default_value(true),     "Evaluate edge value")
            ("evaluate_overall_deviation",    po::value<bool>()->default_value(true),     "Evaluate overall deviation")
            ("generations",                   po::value<unsigned>()->default_value(1000), "Generation count")
            ("input_image_filename",          po::value<std::string>()->required(),       "Input image filename")
            ("mutation_rate",                 po::value<double>()->default_value(0.05),   "Mutation rate")
            ("population_size",               po::value<unsigned>()->default_value(100),  "Population size")
            ("tournament_group_size",         po::value<unsigned>()->default_value(5),    "Tournament group size")
            ("tournament_randomness",         po::value<double>()->default_value(0.1),    "Tournament probability of selecting random winner");

        po::positional_options_description positional_options{};
        positional_options.add("input_image_filename", 1);

        po::variables_map variables{};
        po::store(po::command_line_parser(argc, argv).options(options).positional(positional_options).run(), variables);
        po::notify(variables);

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

        using genotype_type = std::vector<vi::image_segmentation::image_direction>;
        using namespace std::placeholders;

        auto solver = vi::ea::nsga2::build_system<genotype_type>(
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

            std::cout << std::endl;
        }

        auto individual_index = 0U;
        for (const auto& individual : solver.current_population)
        {
            std::vector<vi::image_segmentation::segment_index> segmentation{};
            vi::image_segmentation::segment_index              segment_count{};

            std::tie(segmentation, segment_count) =
                vi::image_segmentation::compile_segmentation_graph(
                    individual.genotype,
                    problem.input_image_width,
                    problem.input_image_height);

            std::cout << boost::format("%u %u %.5f %.5f %.5f")
                % individual_index
                % segment_count
                % individual.objective_values[0]
                % individual.objective_values[1]
                % individual.objective_values[2]
                << std::endl;

            std::ostringstream description{};

            description << boost::format("_segments_%u_individual_%u")
                % segment_count % individual_index;

            for (unsigned objective_value_index = 0U;
                 objective_value_index < objective_count;
                 ++objective_value_index)
            {
                description << boost::format("_%s_%.5f")
                    % objective_names[objective_value_index].c_str()
                    % individual.objective_values[objective_value_index];
            }

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

            ++individual_index;
        }

    }
    catch (const po::error& error)
    {
        std::cerr << "error: " << error.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
