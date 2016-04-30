#include <algorithm>
#include <array>
#include <cstdint>
#include <iostream>
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

int main()
{
    auto rng = std::default_random_engine{std::random_device{}()};
    auto x   = array_sequence_generator<std::uint8_t, 10>(rng);

    for (auto z : x)
    {
        std::cout << static_cast<int>(z) << ' ';
    }

    std::cout << std::endl;

    mutate(x, rng);

    for (auto z : x)
    {
        std::cout << static_cast<int>(z) << ' ';
    }

    std::cout << std::endl;

    mutate(x, rng);

    for (auto z : x)
    {
        std::cout << static_cast<int>(z) << ' ';
    }

    std::cout << std::endl;
}

