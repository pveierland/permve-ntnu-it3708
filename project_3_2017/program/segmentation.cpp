#include <cmath>
#include <cstddef>
#include <iostream>
#include <iterator>
#include <limits>
#include <set>
#include <string>
#include <vector>

#include <boost/numeric/ublas/io.hpp>
#include <boost/numeric/ublas/matrix.hpp>

#include <boost/gil/gil_all.hpp>
#include <boost/gil/extension/io/jpeg_io.hpp>

#include <boost/type_index.hpp>

using boost::numeric::ublas::matrix;

using namespace boost::gil;

template <class T>
void print_type(T) {
    std::cout << boost::typeindex::type_id<T>().pretty_name() << std::endl;
}

template <typename pixel_type>
void print_pixel(const pixel_type& p) {
    std::cout << static_cast<int>(get_color(p, red_t())) << ','
              << static_cast<int>(get_color(p, green_t())) << ','
              << static_cast<int>(get_color(p, blue_t())) << std::endl;
}

template <typename pixel_type>
inline
double
compute_pixel_distance(const pixel_type& a, const pixel_type& b)
{
    return std::sqrt(
        std::pow(static_cast<double>(get_color(a, red_t()))   - static_cast<double>(get_color(b, red_t())),   2) +
        std::pow(static_cast<double>(get_color(a, green_t())) - static_cast<double>(get_color(b, green_t())), 2) +
        std::pow(static_cast<double>(get_color(a, blue_t()))  - static_cast<double>(get_color(b, blue_t())),  2));
}

const auto UNASSIGNED = std::numeric_limits<unsigned>::max();

struct vertex_cost_comparator
{
    vertex_cost_comparator(const std::vector<double>& costs)
        : costs{&costs} {}

    inline
    bool
    operator()(const unsigned vertex_a, const unsigned vertex_b) const
    {
        const auto cost_a = (*costs)[vertex_a];
        const auto cost_b = (*costs)[vertex_b];
        return cost_a != cost_b ? cost_a < cost_b : vertex_a < vertex_b;
    }

    const std::vector<double>* costs;
};

template <typename frontier_type>
inline
bool
update_cheapest(
    const rgb8c_view_t&          view,
    const std::vector<unsigned>& graph,
    const unsigned               parent_vertex,
    const unsigned               target_vertex,
    frontier_type&               frontier,
    std::vector<double>&         cheapest_costs,
    std::vector<unsigned>&       cheapest_edges)
{
    if (graph[target_vertex] == UNASSIGNED)
    {
        const auto cost = compute_pixel_distance(view[parent_vertex], view[target_vertex]);

        if (cost < cheapest_costs[target_vertex])
        {
            if (frontier.count(target_vertex))
            {
                frontier.erase(target_vertex);
            }

            cheapest_costs[target_vertex] = cost;
            cheapest_edges[target_vertex] = parent_vertex;
            
            frontier.insert(target_vertex);
        }
    }

    return false;
}

void build_minimum_spanning_tree(const rgb8c_view_t& view)
{
    const auto width  = static_cast<std::size_t>(view.width());
    const auto height = static_cast<std::size_t>(view.height());
    const auto count  = width * height;

    std::vector<double>   cheapest_costs(count, std::numeric_limits<double>::max());
    std::vector<unsigned> cheapest_edges(count, UNASSIGNED);
    std::vector<unsigned> graph(count, UNASSIGNED);

    vertex_cost_comparator comparator{cheapest_costs};
    std::set<unsigned, vertex_cost_comparator> frontier{comparator};

    frontier.insert(0);

    unsigned i = 0;

    while (!frontier.empty())
    {
        i += 1;

        const auto vertex_it = frontier.begin();
        const auto vertex = *vertex_it;

        frontier.erase(vertex_it);

        const auto cheapest_edge = cheapest_edges[vertex];
        graph[vertex] = cheapest_edge != UNASSIGNED ? cheapest_edge : vertex;

        const auto row    = vertex / width;
        const auto column = vertex % width;

        if (row > 0)
        {
            update_cheapest(view, graph, vertex, vertex - width, frontier, cheapest_costs, cheapest_edges);
        }
        if (row < height - 1)
        {
            update_cheapest(view, graph, vertex, vertex + width, frontier, cheapest_costs, cheapest_edges);
        }
        if (column > 0)
        {
            update_cheapest(view, graph, vertex, vertex - 1, frontier, cheapest_costs, cheapest_edges);
        }
        if (column < width - 1)
        {
            update_cheapest(view, graph, vertex, vertex + 1, frontier, cheapest_costs, cheapest_edges);
        }
    }

    unsigned j = 0;

    for (const auto g : graph)
    {
        if (g == UNASSIGNED)
        {
            j += 1;
        }
    }

    std::cout << i << std::endl;
    std::cout << j << std::endl;
}

int main(const int argc, char *argv[])
{
    rgb8_image_t image{};
    jpeg_read_image(std::string(argv[1]), image);

    build_minimum_spanning_tree(view(image));
}
