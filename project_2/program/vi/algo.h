#pragma once

#include <random>
#include <set>

namespace vi
{
    namespace algo
    {
        // Based on Floyd's algorithm for generating random numbers in range
        // Programming pearls: a sample of brilliance
        // Communications of the ACM
        // Volume 30 Issue 9, Sept. 1987
        // Pages 754-757
        template <typename random_generator_type, typename integral_type>
        void generate_unique_in_range(random_generator_type&   random_generator,
                                      std::set<integral_type>& result,
                                      const integral_type      low_inclusive,
                                      const integral_type      high_inclusive,
                                      const unsigned           count)
        {
            result.clear();

            const auto diff = high_inclusive - low_inclusive + 1;

            for (integral_type i = diff - count; i < diff; ++i)
            {
                const auto t = std::uniform_int_distribution<integral_type>{0, i}(
                    random_generator) + low_inclusive;

                if (result.find(t) != result.end())
                {
                    result.insert(i + low_inclusive);
                }
                else
                {
                    result.insert(t);
                }
            }
        }
    }
}

