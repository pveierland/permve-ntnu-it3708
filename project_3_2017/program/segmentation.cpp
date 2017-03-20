#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <limits>
#include <functional>
#include <set>
#include <string>
#include <utility>
#include <vector>
#include <csignal>

#include <boost/gil/gil_all.hpp>
#include <boost/gil/extension/io/jpeg_io.hpp>
#include <boost/gil/extension/io/png_io.hpp>
#include <boost/program_options.hpp>
#include <boost/format.hpp>
#include <boost/lexical_cast.hpp>

#include "q_gil_converter.hpp"

#include <QApplication>
#include <QColor>
#include <QImage>
#include <QPageSize>
#include <QPainter>
#include <QPoint>
#include <QPrinter>
#include <QSizeF>
#include <QString>

#include <boost/type_index.hpp>

#include <vi_ea_nsga2.hpp>

template <class T>
void print_type(T) {
    std::cout << boost::typeindex::type_id<T>().pretty_name() << std::endl;
}

template <typename pixel_type>
void print_pixel(const pixel_type& p) {
    std::cout << static_cast<int>(boost::gil::get_color(p, boost::gil::red_t())) << ','
              << static_cast<int>(boost::gil::get_color(p, boost::gil::green_t())) << ','
              << static_cast<int>(boost::gil::get_color(p, boost::gil::blue_t())) << std::endl;
}

//void
//render_graph(const std::size_t                                width,
//             const std::size_t                                height,
//             const boost::gil::rgb8_view_t&                   image_view,
//             const vi::segment::image_distances&              distances,
//             const std::vector<vi::segment::image_direction>& graph)
//{
//    QPrinter printer{};
//    printer.setOutputFormat(QPrinter::PdfFormat);
//    printer.setOutputFileName("graph.pdf");
//    printer.setPageMargins(0, 0, 0, 0, QPrinter::Inch);
//
//    printer.setPageSize(QPageSize(
//        QSizeF(static_cast<double>(width)  / printer.resolution(),
//               static_cast<double>(height) / printer.resolution()),
//        QPageSize::Inch));
//
//    QPainter painter{&printer};
//
//    const QImage input_image_q = q_gil::gil_view_to_qimage(image_view);
//
//    painter.drawImage(QPoint(0, 0), input_image_q);
//
//    painter.setPen(QPen{QBrush(Qt::green), 0.0});
//
//    const auto max_value = distances.maximum() / 10.0;
//
//    for (std::size_t y = 0; y < height; ++y)
//    {
//        for (std::size_t x = 0; x < width; ++x)
//        {
//            const auto index = y * width + x;
//            const auto direction = graph[index];
//
//            if (direction != vi::segment::image_direction::none)
//            {
//                const auto value = distances(x, y, direction);
//                const auto ratio = value / max_value;
//                painter.setPen(QPen{QBrush(QColor(
//                    std::min(255, static_cast<int>(std::round(255.0 * ratio))), 0, 0)), 1.0 * ratio});
//            }
//
//            switch (direction)
//            {
//                case vi::segment::image_direction::north:
//                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) - 0.5),
//                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5));
//                    break;
//                case vi::segment::image_direction::east:
//                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
//                                     QPointF(static_cast<double>(x) + 1.5, static_cast<double>(y) + 0.5));
//                    break;
//                case vi::segment::image_direction::south:
//                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
//                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 1.5));
//                    break;
//                case vi::segment::image_direction::west:
//                    painter.drawLine(QPointF(static_cast<double>(x) - 0.5, static_cast<double>(y) + 0.5),
//                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5));
//                    break;
//                case vi::segment::image_direction::none:
//                    painter.drawEllipse(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
//                                        0.5, 0.5);
//                    break;
//            }
//        }
//    }
//
//    painter.end();
//}
//


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
        render_segmentation(const boost::gil::rgb8_view_t&    image_view,
                            const std::vector<segment_index>& segmentation,
                            const std::string&                filename,
                            const bool                        include_image)
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

            const auto alpha = 64;

            const auto colors = std::vector<QColor>{
                QColor(246, 64, 174, alpha),
                QColor(248, 14, 39, alpha),
                QColor(248, 152, 31, alpha),
                QColor(138, 215, 73, alpha),
                QColor(13, 159, 216, alpha),
                QColor(133, 105, 207, alpha),
                QColor(244, 244, 0, alpha),
                QColor(255, 255, 255, alpha),
                QColor(0, 0, 0, alpha),
                QColor(120, 118, 121, alpha)};

            QPainter painter{&printer};

            painter.scale(static_cast<double>(printer.resolution()),
                          static_cast<double>(printer.resolution()));

            const QImage input_image_q = q_gil::gil_view_to_qimage(image_view);

            if (include_image)
            {
                painter.drawImage(QPoint(0, 0), input_image_q);
            }

            //painter.setPen(QPen{QBrush(Qt::green), 0.0});

            for (std::size_t y = 0; y < height; ++y)
            {
                for (std::size_t x = 0; x < width; ++x)
                {
                    const auto index = y * width + x;
                    const auto segment = segmentation[index];

                    painter.fillRect(x, y, 1, 1, colors[segment % colors.size()]);
                }
            }

            //painter.setPen(QPen{QBrush(Qt::green), 0.0});

            //const auto max_value = distances.maximum() / 10.0;

            //for (std::size_t y = 0; y < height; ++y)
            //{
            //    for (std::size_t x = 0; x < width; ++x)
            //    {
            //        const auto index = y * width + x;
            //        const auto direction = graph[index];

            //        // if (direction != vi::segment::image_direction::none)
            //        // {
            //        //     const auto value = distances(x, y, direction);
            //        //     const auto ratio = value / max_value;
            //        //     painter.setPen(QPen{QBrush(QColor(
            //        //         std::min(255, static_cast<int>(std::round(255.0 * ratio))), 0, 0)), 1.0 * ratio});
            //        // }

            //        switch (direction)
            //        {
            //            case vi::segment::image_direction::north:
            //                painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) - 0.5),
            //                                 QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5));
            //                break;
            //            case vi::segment::image_direction::east:
            //                painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
            //                                 QPointF(static_cast<double>(x) + 1.5, static_cast<double>(y) + 0.5));
            //                break;
            //            case vi::segment::image_direction::south:
            //                painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
            //                                 QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 1.5));
            //                break;
            //            case vi::segment::image_direction::west:
            //                painter.drawLine(QPointF(static_cast<double>(x) - 0.5, static_cast<double>(y) + 0.5),
            //                                 QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5));
            //                break;
            //            case vi::segment::image_direction::none:
            //                painter.drawEllipse(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
            //                                    0.5, 0.5);
            //                break;
            //        }
            //    }
            //}

            //painter.end();
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
            ("generations",                   po::value<unsigned>()->default_value(200),  "Generation count")
            ("input_image_filename",          po::value<std::string>()->required(),       "Input image filename")
            ("mutation_rate",                 po::value<double>()->default_value(0.05),   "Mutation rate")
            ("population_size",               po::value<unsigned>()->default_value(1000), "Population size")
            ("tournament_group_size",         po::value<unsigned>()->default_value(20),   "Tournament group size")
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

            vi::image_segmentation::render_segmentation(
                boost::gil::view(problem.input_image),
                segmentation,
                boost::str(boost::format("output_with_%u.pdf") % individual_index),
                true);

            vi::image_segmentation::render_segmentation(
                boost::gil::view(problem.input_image),
                segmentation,
                boost::str(boost::format("output_without_%u.pdf") % individual_index),
                false);

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
