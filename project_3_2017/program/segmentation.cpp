#include <iostream>
#include <string>

#include <boost/gil/gil_all.hpp>
#include <boost/gil/extension/io/jpeg_io.hpp>
#include <boost/gil/extension/io/png_io.hpp>

#include "q_gil_converter.hpp"
#include "vi_segment.hpp"

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

void
render_graph(const std::size_t                                width,
             const std::size_t                                height,
             const boost::gil::rgb8_view_t                    image_view,
             const vi::segment::image_distances&              distances,
             const std::vector<vi::segment::image_direction>& graph)
{
    QPrinter printer{};
    printer.setOutputFormat(QPrinter::PdfFormat);
    printer.setOutputFileName("graph.pdf");
    printer.setPageMargins(0, 0, 0, 0, QPrinter::Inch);

    printer.setPageSize(QPageSize(
        QSizeF(static_cast<double>(width)  / printer.resolution(),
               static_cast<double>(height) / printer.resolution()),
        QPageSize::Inch));

    QPainter painter{&printer};

    const QImage input_image_q = q_gil::gil_view_to_qimage(image_view);

    painter.drawImage(QPoint(0, 0), input_image_q);

    painter.setPen(QPen{QBrush(Qt::green), 0.0});

    const auto max_value = distances.maximum() / 10.0;

    for (std::size_t y = 0; y < height; ++y)
    {
        for (std::size_t x = 0; x < width; ++x)
        {
            const auto index = y * width + x;
            const auto direction = graph[index];

            if (direction != vi::segment::image_direction::none)
            {
                const auto value = distances(x, y, direction);
                const auto ratio = value / max_value;
                painter.setPen(QPen{QBrush(QColor(
                    std::min(255, static_cast<int>(std::round(255.0 * ratio))), 0, 0)), 1.0 * ratio});
            }

            switch (direction)
            {
                case vi::segment::image_direction::north:
                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) - 0.5),
                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5));
                    break;
                case vi::segment::image_direction::east:
                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
                                     QPointF(static_cast<double>(x) + 1.5, static_cast<double>(y) + 0.5));
                    break;
                case vi::segment::image_direction::south:
                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 1.5));
                    break;
                case vi::segment::image_direction::west:
                    painter.drawLine(QPointF(static_cast<double>(x) - 0.5, static_cast<double>(y) + 0.5),
                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5));
                    break;
                case vi::segment::image_direction::none:
                    painter.drawEllipse(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
                                        0.5, 0.5);
                    break;
            }
        }
    }

    painter.end();
}

void
render_segmentation(const std::size_t                                width,
                    const std::size_t                                height,
                    const boost::gil::rgb8_view_t                    image_view,
                    const std::vector<vi::segment::segment_index>&   segmentation,
                    const vi::segment::image_distances&              distances,
                    const std::vector<vi::segment::image_direction>& graph)
{
    QPrinter printer{};
    printer.setOutputFormat(QPrinter::PdfFormat);
    printer.setOutputFileName("segmentation.pdf");
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

    //const QImage input_image_q = q_gil::gil_view_to_qimage(image_view);

    //painter.drawImage(QPoint(0, 0), input_image_q);

    painter.setPen(QPen{QBrush(Qt::green), 0.0});

    for (std::size_t y = 0; y < height; ++y)
    {
        for (std::size_t x = 0; x < width; ++x)
        {
            const auto index = y * width + x;
            const auto segment = segmentation[index];

            painter.fillRect(x, y, 1, 1, colors[segment % colors.size()]);
        }
    }

    painter.setPen(QPen{QBrush(Qt::green), 0.0});

    //const auto max_value = distances.maximum() / 10.0;

    for (std::size_t y = 0; y < height; ++y)
    {
        for (std::size_t x = 0; x < width; ++x)
        {
            const auto index = y * width + x;
            const auto direction = graph[index];

            // if (direction != vi::segment::image_direction::none)
            // {
            //     const auto value = distances(x, y, direction);
            //     const auto ratio = value / max_value;
            //     painter.setPen(QPen{QBrush(QColor(
            //         std::min(255, static_cast<int>(std::round(255.0 * ratio))), 0, 0)), 1.0 * ratio});
            // }

            switch (direction)
            {
                case vi::segment::image_direction::north:
                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) - 0.5),
                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5));
                    break;
                case vi::segment::image_direction::east:
                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
                                     QPointF(static_cast<double>(x) + 1.5, static_cast<double>(y) + 0.5));
                    break;
                case vi::segment::image_direction::south:
                    painter.drawLine(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 1.5));
                    break;
                case vi::segment::image_direction::west:
                    painter.drawLine(QPointF(static_cast<double>(x) - 0.5, static_cast<double>(y) + 0.5),
                                     QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5));
                    break;
                case vi::segment::image_direction::none:
                    painter.drawEllipse(QPointF(static_cast<double>(x) + 0.5, static_cast<double>(y) + 0.5),
                                        0.5, 0.5);
                    break;
            }
        }
    }

    painter.end();
}

double
compute_overall_deviation(
    const boost::gil::rgb8_view_t                  image_view,
    const std::vector<vi::segment::segment_index>& segmentation,
    const int                                      segment_count)
{
    double overall_deviation = 0.0;

    std::vector<std::tuple<std::size_t, double, double, double, boost::gil::rgb8_pixel_t>>
        segments_color_sums(segment_count);

    for (std::size_t index = 0; index != segmentation.size(); ++index)
    {
        const auto& pixel   = image_view[index];
        const auto  segment = segmentation[index];

        auto& segment_color_sums = segments_color_sums[segment - 1];

        std::get<0>(segment_color_sums) += 1;
        std::get<1>(segment_color_sums) += static_cast<double>(boost::gil::get_color(pixel, boost::gil::red_t()));
        std::get<2>(segment_color_sums) += static_cast<double>(boost::gil::get_color(pixel, boost::gil::green_t()));
        std::get<3>(segment_color_sums) += static_cast<double>(boost::gil::get_color(pixel, boost::gil::blue_t()));
    }

    for (auto& segment_color_sums : segments_color_sums)
    {
        std::get<4>(segment_color_sums) = boost::gil::rgb8_pixel_t{
            static_cast<unsigned char>(std::round(std::get<1>(segment_color_sums) / std::get<0>(segment_color_sums))),
            static_cast<unsigned char>(std::round(std::get<2>(segment_color_sums) / std::get<0>(segment_color_sums))),
            static_cast<unsigned char>(std::round(std::get<3>(segment_color_sums) / std::get<0>(segment_color_sums)))};
    }

    for (std::size_t index = 0; index != segmentation.size(); ++index)
    {
        const auto  segment  = segmentation[index];
        const auto& pixel    = image_view[index];
        const auto& centroid = std::get<4>(segments_color_sums[segment - 1]);

        overall_deviation += vi::segment::compute_pixel_distance(pixel, centroid);
    }

    return overall_deviation;
}

int
main(int argc, char *argv[])
{
    int arg_count = 3;
    auto arg0     = "application";
    auto arg1     = "-platform";
    auto arg2     = "offscreen";
    char* args[]  = {const_cast<char*>(arg0), const_cast<char*>(arg1), const_cast<char*>(arg2)};

    QApplication app{arg_count, args};

    auto input_image = boost::gil::rgb8_image_t{};
    //boost::gil::jpeg_read_image(std::string(argv[1]), input_image);
    boost::gil::png_read_image(std::string(argv[1]), input_image);

    auto input_image_view      = boost::gil::view(input_image);
    //auto input_image_view      = boost::gil::subimage_view(boost::gil::view(input_image), 0, 0, 10, 10);
    auto input_image_distances = vi::segment::image_distances{input_image_view};

    auto graph        = vi::segment::build_minimum_spanning_tree(input_image_distances, 0);
    auto segmentation = vi::segment::process(
        graph, input_image_distances.image_width, input_image_distances.image_height);

    //render_graph(input_image_distances.image_width, input_image_distances.image_height, input_image_view, input_image_distances, graph);
    //render_segmentation(input_image_distances.image_width, input_image_distances.image_height, input_image_view, segmentation, input_image_distances, graph);

    std::cout << compute_overall_deviation(input_image_view, segmentation, 1) << std::endl;
}
