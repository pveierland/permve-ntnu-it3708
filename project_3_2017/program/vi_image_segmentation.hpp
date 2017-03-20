#pragma once

#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <limits>
#include <set>
#include <string>
#include <utility>
#include <vector>

#include <boost/gil/gil_all.hpp>
#include <boost/gil/extension/io/jpeg_io.hpp>

#include <QColor>
#include <QImage>
#include <QPageSize>
#include <QPainter>
#include <QPoint>
#include <QPrinter>
#include <QSizeF>
#include <QString>

#include <q_gil_converter.hpp>

namespace vi
{
    namespace image_segmentation
    {
        using vertex_index  = unsigned;
        using edge_distance = double;
        using segment_index = unsigned;

        enum struct image_direction : unsigned
        {
            unassigned = 0U, none, north, east, south, west
        };

        const auto SEGMENT_COLORS = std::vector<QColor>{
            QColor{178,223,138},
            QColor{106,61,154},
            QColor{188,128,189},
            QColor{128,177,211},
            QColor{141,211,199},
            QColor{255,255,153},
            QColor{202,178,214},
            QColor{51,160,44},
            QColor{190,186,218},
            QColor{177,89,40},
            QColor{227,26,28},
            QColor{31,120,180},
            QColor{166,206,227},
            QColor{255,237,111},
            QColor{251,154,153},
            QColor{255,127,0},
            QColor{253,191,111},
            QColor{251,128,114},
            QColor{252,205,229},
            QColor{255,255,179},
            QColor{204,235,197},
            QColor{179,222,105},
            QColor{253,180,98}
        };

        template <typename pixel_type>
        inline
        double
        compute_pixel_distance(const pixel_type& a, const pixel_type& b)
        {
            using namespace boost::gil;

            return std::sqrt(
                std::pow(static_cast<double>(get_color(a, red_t()))   - static_cast<double>(get_color(b, red_t())),   2) +
                std::pow(static_cast<double>(get_color(a, green_t())) - static_cast<double>(get_color(b, green_t())), 2) +
                std::pow(static_cast<double>(get_color(a, blue_t()))  - static_cast<double>(get_color(b, blue_t())),  2));
        }

        double
        compute_overall_deviation(
            const boost::gil::rgb8_view_t&    image_view,
            const std::vector<segment_index>& segmentation,
            const int                         segment_count)
        {
            struct segment_color_sums_info
            {
                std::size_t              count{};
                double                   red_sum{};
                double                   green_sum{};
                double                   blue_sum{};
                boost::gil::rgb8_pixel_t centroid{};
            };

            double overall_deviation = 0.0;

            std::vector<segment_color_sums_info> segments_color_sums(segment_count);

            auto       pixel       = image_view.begin();
            auto       segment     = segmentation.begin();
            const auto segment_end = segmentation.end();

            while (segment != segment_end)
            {
                auto& segment_color_sums = segments_color_sums[*segment - 1];

                segment_color_sums.count     += 1;
                segment_color_sums.red_sum   += static_cast<double>(boost::gil::get_color(*pixel, boost::gil::red_t()));
                segment_color_sums.green_sum += static_cast<double>(boost::gil::get_color(*pixel, boost::gil::green_t()));
                segment_color_sums.blue_sum  += static_cast<double>(boost::gil::get_color(*pixel, boost::gil::blue_t()));

                ++pixel;
                ++segment;
            }

            for (auto& segment_color_sums : segments_color_sums)
            {
                segment_color_sums.centroid = boost::gil::rgb8_pixel_t{
                    static_cast<unsigned char>(std::round(segment_color_sums.red_sum   / segment_color_sums.count)),
                    static_cast<unsigned char>(std::round(segment_color_sums.green_sum / segment_color_sums.count)),
                    static_cast<unsigned char>(std::round(segment_color_sums.blue_sum  / segment_color_sums.count))};
            }

            pixel   = image_view.begin();
            segment = segmentation.begin();

            while (segment != segment_end)
            {
                const auto& segment_color_sums = segments_color_sums[*segment - 1];

                overall_deviation += compute_pixel_distance(*pixel, segment_color_sums.centroid);

                ++pixel;
                ++segment;
            }

            return overall_deviation;
        }

        double
        compute_edge_value(
            const boost::gil::rgb8_view_t&    image_view,
            const std::vector<segment_index>& segmentation,
            const int                         segment_count)
        {
            double edge_value = 0.0;

            const auto width  = static_cast<std::size_t>(image_view.width());
            const auto height = static_cast<std::size_t>(image_view.height());

            auto pixel_current   = image_view.begin();
            auto pixel_next      = pixel_current + 1;
            auto pixel_below     = pixel_current + width;
            auto segment_current = segmentation.begin();
            auto segment_next    = segment_current + 1;
            auto segment_below   = segment_current + width;

            for (std::size_t y = 0; y < height - 1; ++y)
            {
                for (std::size_t x = 0; x < width - 1; ++x)
                {
                    if (*segment_current != *segment_below)
                    {
                        edge_value -= 2.0 * compute_pixel_distance(*pixel_current, *pixel_below);
                    }

                    if (*segment_current != *segment_next)
                    {
                        edge_value -= 2.0 * compute_pixel_distance(*pixel_current, *pixel_next);
                    }

                    ++pixel_current;
                    ++pixel_next;
                    ++pixel_below;

                    ++segment_current;
                    ++segment_next;
                    ++segment_below;
                }

                if (*segment_current != *segment_below)
                {
                    edge_value -= 2.0 * compute_pixel_distance(*pixel_current, *pixel_below);
                }

                ++pixel_current;
                ++pixel_next;
                ++pixel_below;

                ++segment_current;
                ++segment_next;
                ++segment_below;
            }

            for (std::size_t x = 0; x < width - 1; ++x)
            {
                if (*segment_current != *segment_next)
                {
                    edge_value -= 2.0 * compute_pixel_distance(*pixel_current, *pixel_next);
                }

                ++pixel_current;
                ++pixel_next;
                ++pixel_below;

                ++segment_current;
                ++segment_next;
                ++segment_below;
            }

            return edge_value;
        }

        double
        compute_connectivity_measure(
            const boost::gil::rgb8_view_t&    image_view,
            const std::vector<segment_index>& segmentation,
            const int                         segment_count)
        {
            double connectivity_measure = 0.0;

            constexpr double disconnected_neighbor_penalties[] =
            {
                0.0,
                1.0,
                1.0 + 1.0 / 2.0,
                1.0 + 1.0 / 2.0 + 1.0 / 3.0,
                1.0 + 1.0 / 2.0 + 1.0 / 3.0 + 1.0 / 4.0
            };

            const auto width  = static_cast<std::size_t>(image_view.width());
            const auto height = static_cast<std::size_t>(image_view.height());

            auto segment_current = segmentation.begin();
            auto segment_above   = segment_current;
            auto segment_below   = segment_current + width;

            connectivity_measure += disconnected_neighbor_penalties[
                ((*segment_current != *(segment_current + 1)) ? 1 : 0) +
                ((*segment_current != *(segment_below      )) ? 1 : 0)];

            ++segment_current;
            ++segment_below;

            for (std::size_t x = 0; x < width - 2; ++x)
            {
                connectivity_measure += disconnected_neighbor_penalties[
                    ((*segment_current != *(segment_current - 1)) ? 1 : 0) +
                    ((*segment_current != *(segment_current + 1)) ? 1 : 0) +
                    ((*segment_current != *(segment_below      )) ? 1 : 0)];

                ++segment_current;
                ++segment_below;
            }

            connectivity_measure += disconnected_neighbor_penalties[
                ((*segment_current != *(segment_current - 1)) ? 1 : 0) +
                ((*segment_current != *(segment_below      )) ? 1 : 0)];

            ++segment_current;
            ++segment_below;

            for (std::size_t y = 0; y < height - 2; ++y)
            {
                connectivity_measure += disconnected_neighbor_penalties[
                    ((*segment_current != *(segment_above      )) ? 1 : 0) +
                    ((*segment_current != *(segment_current + 1)) ? 1 : 0) +
                    ((*segment_current != *(segment_below      )) ? 1 : 0)];

                ++segment_current;
                ++segment_below;
                ++segment_above;

                for (std::size_t x = 0; x < width - 2; ++x)
                {
                    connectivity_measure += disconnected_neighbor_penalties[
                        ((*segment_current != *(segment_above      )) ? 1 : 0) +
                        ((*segment_current != *(segment_current - 1)) ? 1 : 0) +
                        ((*segment_current != *(segment_current + 1)) ? 1 : 0) +
                        ((*segment_current != *(segment_below      )) ? 1 : 0)];

                    ++segment_current;
                    ++segment_below;
                    ++segment_above;
                }

                connectivity_measure += disconnected_neighbor_penalties[
                    ((*segment_current != *(segment_above      )) ? 1 : 0) +
                    ((*segment_current != *(segment_current - 1)) ? 1 : 0) +
                    ((*segment_current != *(segment_below      )) ? 1 : 0)];

                ++segment_current;
                ++segment_below;
                ++segment_above;
            }

            connectivity_measure += disconnected_neighbor_penalties[
                ((*segment_current != *(segment_above      )) ? 1 : 0) +
                ((*segment_current != *(segment_current + 1)) ? 1 : 0)];

            ++segment_current;
            ++segment_above;

            for (std::size_t x = 0; x < width - 2; ++x)
            {
                connectivity_measure += disconnected_neighbor_penalties[
                    ((*segment_current != *(segment_above      )) ? 1 : 0) +
                    ((*segment_current != *(segment_current - 1)) ? 1 : 0) +
                    ((*segment_current != *(segment_current + 1)) ? 1 : 0)];

                ++segment_current;
                ++segment_above;
            }

            connectivity_measure += disconnected_neighbor_penalties[
                ((*segment_current != *(segment_above      )) ? 1 : 0) +
                ((*segment_current != *(segment_current - 1)) ? 1 : 0)];

            return connectivity_measure;
        }

        void
        render(const boost::gil::rgb8_view_t&    image_view,
               const std::vector<segment_index>& segmentation,
               const std::string&                filename,
               const bool                        render_image,
               const bool                        render_borders,
               const bool                        render_segments)
        {
            const auto width  = static_cast<std::size_t>(image_view.width());
            const auto height = static_cast<std::size_t>(image_view.height());

            QPrinter printer{};
            printer.setOutputFormat(QPrinter::PdfFormat);
            printer.setOutputFileName(filename.c_str());
            printer.setPageMargins(0, 0, 0, 0, QPrinter::Inch);

            printer.setPageSize(QPageSize(
                QSizeF(static_cast<double>(width), static_cast<double>(height)),
                QPageSize::Inch,
                QString(""),
                QPageSize::SizeMatchPolicy::ExactMatch));

            QPainter painter{&printer};

            painter.scale(static_cast<double>(printer.resolution()),
                          static_cast<double>(printer.resolution()));

            if (render_image)
            {
                const QImage input_image_q = q_gil::gil_view_to_qimage(image_view);
                painter.drawImage(QPoint(0, 0), input_image_q);
            }

            if (render_segments)
            {
                for (std::size_t y = 0; y < height; ++y)
                {
                    for (std::size_t x = 0; x < width; ++x)
                    {
                        const auto index = y * width + x;
                        const auto segment = segmentation[index];

                        // Stupid hack to render without dividers:
                        painter.fillRect(QRectF{static_cast<double>(x) - 0.05,
                                                static_cast<double>(y) - 0.05,
                                                1.1,
                                                1.1},
                                         SEGMENT_COLORS[segment % SEGMENT_COLORS.size()]);
                    }
                }
            }

            if (render_borders)
            {
                painter.setPen(
                    QPen{QBrush((render_image || render_segments) ? QColor{42, 254, 39} : Qt::black),
                         0.2,
                         Qt::SolidLine,
                         Qt::RoundCap});

                for (std::size_t y = 0; y < height; ++y)
                {
                    for (std::size_t x = 0; x < width; ++x)
                    {
                        if (x < width - 1 && segmentation[y * width + x] != segmentation[y * width + x + 1])
                        {
                            painter.drawLine(QPointF(static_cast<double>(x) + 1.0, static_cast<double>(y)),
                                             QPointF(static_cast<double>(x) + 1.0, static_cast<double>(y) + 1.0));
                        }

                        if (y < height - 1 && segmentation[y * width + x] != segmentation[(y + 1) * width + x])
                        {
                            painter.drawLine(QPointF(static_cast<double>(x),       static_cast<double>(y) + 1.0),
                                             QPointF(static_cast<double>(x) + 1.0, static_cast<double>(y) + 1.0));
                        }
                    }
                }

                painter.drawRect(QRectF(0.0, 0.0, static_cast<double>(width), static_cast<double>(height)));
            }
        }

        void
        inline
        trace_segment(std::vector<segment_index>&         segments,
                      const std::vector<image_direction>& graph,
                      const std::size_t                   width,
                      const std::size_t                   height,
                      const std::size_t                   x,
                      const std::size_t                   y,
                      const segment_index                 segment,
                      const image_direction               direction = image_direction::none)
        {
            const auto index = y * width + x;

            if (!segments[index])
            {
                segments[index] = segment;

                if ((y > 0 && direction != image_direction::south) &&
                    (graph[index] == image_direction::north || graph[index - width] == image_direction::south))
                {
                    trace_segment(segments, graph, width, height, x, y - 1, segment, image_direction::north);
                }

                if ((y < height - 1 && direction != image_direction::north) &&
                    (graph[index] == image_direction::south || graph[index + width] == image_direction::north))
                {
                    trace_segment(segments, graph, width, height, x, y + 1, segment, image_direction::south);
                }

                if ((x > 0 && direction != image_direction::east) &&
                    (graph[index] == image_direction::west || graph[index - 1] == image_direction::east))
                {
                    trace_segment(segments, graph, width, height, x - 1, y, segment, image_direction::west);
                }

                if ((x < width - 1 && direction != image_direction::west) &&
                    (graph[index] == image_direction::east || graph[index + 1] == image_direction::west))
                {
                    trace_segment(segments, graph, width, height, x + 1, y, segment, image_direction::east);
                }
            }
        }

        std::pair<std::vector<segment_index>, segment_index>
        compile_segmentation_graph(const std::vector<image_direction>& graph,
                                   const std::size_t                   width,
                                   const std::size_t                   height)
        {
            auto segmentation    = std::vector<segment_index>(graph.size());
            auto segment_counter = segment_index{1U};

            for (std::size_t y = 0; y < height; ++y)
            {
                for (std::size_t x = 0; x < width; ++x)
                {
                    const auto index = y * width + x;

                    if (!segmentation[index])
                    {
                        const auto segment = segment_counter++;
                        trace_segment(segmentation, graph, width, height, x, y, segment);
                    }
                }
            }

            return std::make_pair(std::move(segmentation), segment_counter - 1U);
        }

        struct image_distances
        {
            std::size_t         image_width;
            std::size_t         image_height;
            std::vector<double> costs;

            image_distances(const boost::gil::rgb8c_view_t& view)
                : image_width(static_cast<std::size_t>(view.width())),
                  image_height(static_cast<std::size_t>(view.height())),
                  costs((image_width * 2 - 1) * (image_height * 2 - 1),
                        std::numeric_limits<double>::quiet_NaN())
            {
                for (unsigned y = 0; y < image_height; ++y)
                {
                    for (unsigned x = 0; x < image_width; ++x)
                    {
                        if (x > 0)
                        {
                            (*this)(x, y, image_direction::west) = compute_pixel_distance(view(x - 1, y), view(x, y));
                        }

                        if (y > 0)
                        {
                            (*this)(x, y, image_direction::north) = compute_pixel_distance(view(x, y - 1), view(x, y));
                        }
                    }
                }
            }

            inline
            std::size_t
            computePixelDirectionIndex(const std::size_t x, const std::size_t y, const image_direction direction) const
            {
                switch (direction)
                {
                    case image_direction::north:
                        return (y * 2 - 1) * image_width + x * 2;
                    case image_direction::east:
                        return y * 2 * image_width + x * 2 + 1;
                    case image_direction::south:
                        return (y * 2 + 1) * image_width + x * 2;
                    case image_direction::west:
                        return y * 2 * image_width + x * 2 - 1;
                    default:
                        std::exit(-1);
                }
            }

            inline
            double
            maximum() const
            {
                auto max_value = std::numeric_limits<double>::min();

                for (const auto value : costs)
                {
                    if (!std::isnan(value) && value > max_value)
                    {
                        max_value = value;
                    }
                }

                return max_value;
            }

            inline
            double&
            operator()(const std::size_t x, const std::size_t y, const image_direction direction)
            {
                return costs[computePixelDirectionIndex(x, y, direction)];
            }

            inline
            const double&
            operator()(const std::size_t x, const std::size_t y, const image_direction direction) const
            {
                return costs[computePixelDirectionIndex(x, y, direction)];
            }
        };

        struct vertex_cost_comparator
        {
            vertex_cost_comparator(const std::vector<double>& costs)
                : costs{&costs} {}

            inline
            bool
            operator()(const vertex_index vertex_a, const vertex_index vertex_b) const
            {
                const auto cost_a = (*costs)[vertex_a];
                const auto cost_b = (*costs)[vertex_b];
                return cost_a != cost_b ? cost_a < cost_b : vertex_a < vertex_b;
            }

            const std::vector<double>* costs;
        };

        struct edge_distance_comparator
        {
            inline
            bool
            operator()(const std::pair<vertex_index, edge_distance>& a,
                       const std::pair<vertex_index, edge_distance>& b)
            {
                return a.second > b.second;
            }
        };

        template <typename frontier_type>
        inline
        bool
        update_cheapest(
            const std::vector<image_direction>& graph,
            const vertex_index                  parent_vertex,
            const vertex_index                  target_vertex,
            const image_direction               target_edge_direction,
            const double                        distance,
            frontier_type&                      frontier,
            std::vector<double>&                lowest_vertex_costs,
            std::vector<image_direction>&       lowest_cost_edges)
        {
            if (graph[target_vertex] == image_direction::unassigned)
            {
                if (distance < lowest_vertex_costs[target_vertex])
                {
                    if (frontier.count(target_vertex))
                    {
                        frontier.erase(target_vertex);
                    }

                    lowest_vertex_costs[target_vertex] = distance;
                    lowest_cost_edges[target_vertex]   = target_edge_direction;

                    frontier.insert(target_vertex);
                }
            }

            return false;
        }

        template <typename random_generator_type>
        std::vector<image_direction>
        build_minimum_spanning_tree(random_generator_type& random_generator,
                                    const image_distances& distances,
                                    const int              remove_edge_count = 0)
        {
            const auto width  = distances.image_width;
            const auto height = distances.image_height;
            const auto count  = width * height;

            auto graph               = std::vector<image_direction>(count, image_direction::unassigned);
            auto lowest_vertex_costs = std::vector<double>(count, std::numeric_limits<double>::max());
            auto lowest_cost_edges   = std::vector<image_direction>(count, image_direction::unassigned);
            auto highest_cost_edges  = std::set<
                std::pair<vertex_index, edge_distance>, edge_distance_comparator>{};

            vertex_cost_comparator comparator{lowest_vertex_costs};
            std::set<vertex_index, vertex_cost_comparator> frontier{comparator};

            const auto initial_vertex = std::uniform_int_distribution<unsigned>{
                0U, static_cast<unsigned>(count) - 1U}(random_generator);

            frontier.insert(initial_vertex);

            while (!frontier.empty())
            {
                const auto vertex_it = frontier.begin();
                const auto vertex    = *vertex_it;

                frontier.erase(vertex_it);

                const auto cheapest_edge = lowest_cost_edges[vertex];
                graph[vertex] = cheapest_edge != image_direction::unassigned ? cheapest_edge : image_direction::none;

                const auto cheapest_distance = cheapest_edge != image_direction::unassigned ? lowest_vertex_costs[vertex] : 0.0;

                if (remove_edge_count)
                {
                    if (highest_cost_edges.size() < remove_edge_count)
                    {
                        highest_cost_edges.insert(std::make_pair(vertex, cheapest_distance));
                    }
                    else if (cheapest_distance > highest_cost_edges.rend()->second)
                    {
                        highest_cost_edges.erase(--highest_cost_edges.end());
                        highest_cost_edges.insert(std::make_pair(vertex, cheapest_distance));
                    }
                }

                const auto row    = vertex / width;
                const auto column = vertex % width;

                if (row > 0)
                {
                    update_cheapest(graph,
                                    vertex,
                                    vertex - width,
                                    image_direction::south,
                                    distances(column, row, image_direction::north),
                                    frontier,
                                    lowest_vertex_costs,
                                    lowest_cost_edges);
                }

                if (row < height - 1)
                {
                    update_cheapest(graph,
                                    vertex,
                                    vertex + width,
                                    image_direction::north,
                                    distances(column, row, image_direction::south),
                                    frontier,
                                    lowest_vertex_costs,
                                    lowest_cost_edges);
                }

                if (column > 0)
                {
                    update_cheapest(graph,
                                    vertex,
                                    vertex - 1,
                                    image_direction::east,
                                    distances(column, row, image_direction::west),
                                    frontier,
                                    lowest_vertex_costs,
                                    lowest_cost_edges);
                }

                if (column < width - 1)
                {
                    update_cheapest(graph,
                                    vertex,
                                    vertex + 1,
                                    image_direction::west,
                                    distances(column, row, image_direction::east),
                                    frontier,
                                    lowest_vertex_costs,
                                    lowest_cost_edges);
                }
            }

            for (const auto& highest_cost_edge : highest_cost_edges)
            {
                graph[highest_cost_edge.first] = image_direction::none;
            }

            return graph;
        }

        struct moea
        {
            template <typename random_generator_type>
            static
            std::pair<std::vector<image_direction>, std::vector<image_direction>>
            crossover_operator(random_generator_type&              random_generator,
                               const std::vector<image_direction>& parent_a,
                               const std::vector<image_direction>& parent_b)
            {
                const auto sequence_length = static_cast<unsigned>(parent_a.size());

                auto children = std::make_pair(
                    std::vector<image_direction>(sequence_length, image_direction::unassigned),
                    std::vector<image_direction>(sequence_length, image_direction::unassigned));

                auto& child_a = children.first;
                auto& child_b = children.second;

                const auto crossover_point = std::uniform_int_distribution<unsigned>{
                    0U, sequence_length}(random_generator);

                std::copy(parent_a.begin(),
                          parent_a.begin() + crossover_point,
                          child_a.begin());

                std::copy(parent_b.begin() + crossover_point,
                          parent_b.end(),
                          child_a.begin() + crossover_point);

                std::copy(parent_b.begin(),
                          parent_b.begin() + crossover_point,
                          child_b.begin());

                std::copy(parent_a.begin() + crossover_point,
                          parent_a.end(),
                          child_b.begin() + crossover_point);

                return children;
            }

            static
            boost::gil::rgb8_image_t
            load_image(const std::string& image_filename)
            {
                boost::gil::rgb8_image_t image{};
                boost::gil::jpeg_read_image(image_filename, image);
                return image;
            }

            template <typename random_generator_type>
            static
            void
            mutate_operator(random_generator_type&        random_generator,
                            std::vector<image_direction>& genotype)
            {
                const auto index = std::uniform_int_distribution<unsigned>{
                    0U, static_cast<unsigned>(genotype.size()) - 1U}(random_generator);

                const auto value = static_cast<image_direction>(
                    std::uniform_int_distribution<unsigned>{
                        static_cast<unsigned>(image_direction::none),
                        static_cast<unsigned>(image_direction::west)}(random_generator));

                genotype[index] = value;
            }

            boost::gil::rgb8_image_t input_image;
            std::size_t              input_image_width;
            std::size_t              input_image_height;
            image_distances          input_image_distances;
            bool                     evaluate_overall_deviation;
            bool                     evaluate_edge_value;
            bool                     evaluate_connectivity_measure;

            moea(const std::string& input_image_filename,
                 const bool         evaluate_overall_deviation,
                 const bool         evaluate_edge_value,
                 const bool         evaluate_connectivity_measure)
                : input_image{load_image(input_image_filename)},
                  input_image_width{static_cast<std::size_t>(input_image.width())},
                  input_image_height{static_cast<std::size_t>(input_image.height())},
                  input_image_distances{boost::gil::view(input_image)},
                  evaluate_overall_deviation{evaluate_overall_deviation},
                  evaluate_edge_value{evaluate_edge_value},
                  evaluate_connectivity_measure{evaluate_connectivity_measure}
            {
            }

            std::vector<double>
            evaluate(const std::vector<image_direction>& genotype)
            {
                std::vector<double> objective_values{};

                std::vector<segment_index> segmentation{};
                segment_index              segment_count{};

                std::tie(segmentation, segment_count) = compile_segmentation_graph(
                    genotype, input_image_width, input_image_height);

                if (evaluate_overall_deviation)
                {
                    objective_values.push_back(
                        compute_overall_deviation(
                            boost::gil::view(input_image),
                            segmentation,
                            segment_count));
                }

                if (evaluate_edge_value)
                {
                    objective_values.push_back(
                        compute_edge_value(
                            boost::gil::view(input_image),
                            segmentation,
                            segment_count));
                }

                if (evaluate_connectivity_measure)
                {
                    objective_values.push_back(
                        compute_connectivity_measure(
                            boost::gil::view(input_image),
                            segmentation,
                            segment_count));
                }

                return objective_values;
            }

            template <typename random_generator_type>
            std::vector<image_direction>
            generate(random_generator_type& random_generator)
            {
                return build_minimum_spanning_tree(
                    random_generator, input_image_distances);
            }
        };
    }
}