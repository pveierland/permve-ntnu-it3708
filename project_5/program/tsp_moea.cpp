#include <algorithm>
#include <array>
#include <cstdint>
#include <iostream>
#include <iterator>
#include <numeric>
#include <random>
#include <utility>

template <class T, std::size_t N, class URNG>
std::array<T, N>
array_sequence_generator(URNG&& g)
{
    std::array<T, N> sequence;
    std::iota(sequence.begin(), sequence.end(), 0);
    std::shuffle(sequence.begin(), sequence.end(), g);
    return sequence;
}

template <class T, std::size_t N, class URNG>
std::array<T, N>&
mutate(std::array<T, N>& sequence, URNG&& g)
{
    auto distribution = std::uniform_int_distribution<
        typename std::array<T, N>::size_type>{0, N - 1};
    std::swap(sequence[distribution(g)], sequence[distribution(g)]);
    return sequence;
}

template <class value_type>
struct individual
{
    value_type value;
};

template <class T, std::size_t N, class URNG>
void
crossover_pmx(const std::array<T, N>& parent_a,
              const std::array<T, N>& parent_b,
              std::array<T, N>&       child_a,
              std::array<T, N>&       child_b,
              URNG&&                  g)
{
    const auto crossover_point = std::uniform_int_distribution<std::size_t>{0, N}(g);

    std::copy(parent_a.begin(), parent_a.end(), child_a.begin());
    std::copy(parent_b.begin(), parent_b.end(), child_b.begin());

    for (std::size_t i = 0; i < crossover_point; ++i)
    {
        std::swap(*(child_a.begin() + i),
                  *std::find(child_a.begin() + i, child_a.end(), parent_b[i]));
        std::swap(*(child_b.begin() + i),
                  *std::find(child_b.begin() + i, child_b.end(), parent_a[i]));
    }
}

template <class T, std::size_t N>
void
print(const std::array<T, N>& x)
{
    for (auto z : x)
    {
        std::cout << static_cast<int>(z) << ' ';
    }

    std::cout << std::endl;
}

int main()
{
    auto rng = std::default_random_engine{std::random_device{}()};
    //auto x   = array_sequence_generator<std::uint8_t, 10>(rng);

    std::array<std::uint8_t, 7> parent_a{5, 7, 1, 3, 6, 4, 2};
    std::array<std::uint8_t, 7> parent_b{4, 6, 2, 7, 3, 1, 5};

    std::array<std::uint8_t, 7> child_a, child_b;

    crossover_pmx(parent_a, parent_b, child_a, child_b, rng);

    print(parent_a);
    print(parent_b);
    print(child_a);
    print(child_b);
}

