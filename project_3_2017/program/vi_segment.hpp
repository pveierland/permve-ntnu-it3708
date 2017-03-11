#pragma once

#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <limits>
#include <set>
#include <utility>
#include <vector>

#include <boost/gil/gil_all.hpp>

namespace vi
{
    namespace segment
    {
        using vertex_index  = unsigned;
        using edge_distance = double;
        using segment_index = unsigned;

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

        enum struct image_direction
        {
            unassigned, none, north, east, south, west
        };

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

        std::vector<image_direction>
        build_minimum_spanning_tree(const image_distances& distances, const int remove_edge_count = 0)
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

            frontier.insert(0);

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

        void
        inline
        tag(std::vector<segment_index>&         segments,
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
                    tag(segments, graph, width, height, x, y - 1, segment, image_direction::north);
                }

                if ((y < height - 1 && direction != image_direction::north) &&
                    (graph[index] == image_direction::south || graph[index + width] == image_direction::north))
                {
                    tag(segments, graph, width, height, x, y + 1, segment, image_direction::south);
                }

                if ((x > 0 && direction != image_direction::east) &&
                    (graph[index] == image_direction::west || graph[index - 1] == image_direction::east))
                {
                    tag(segments, graph, width, height, x - 1, y, segment, image_direction::west);
                }

                if ((x < width - 1 && direction != image_direction::west) &&
                    (graph[index] == image_direction::east || graph[index + 1] == image_direction::west))
                {
                    tag(segments, graph, width, height, x + 1, y, segment, image_direction::east);
                }
            }
        }

        std::vector<segment_index>
        process(const std::vector<image_direction>& graph,
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
                        tag(segmentation, graph, width, height, x, y, segment);
                    }
                }
            }

            return segmentation;
        }
    }
}
