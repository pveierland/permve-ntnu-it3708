#include <iostream>
#include <string>

#include <boost/gil/gil_all.hpp>
#include <boost/gil/extension/io/jpeg_io.hpp>

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

// #include <boost/type_index.hpp>

// template <class T>
// void print_type(T) {
//     std::cout << boost::typeindex::type_id<T>().pretty_name() << std::endl;
// }

// template <typename pixel_type>
// void print_pixel(const pixel_type& p) {
//     std::cout << static_cast<int>(get_color(p, red_t())) << ','
//               << static_cast<int>(get_color(p, green_t())) << ','
//               << static_cast<int>(get_color(p, blue_t())) << std::endl;
// }

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
    boost::gil::jpeg_read_image(std::string(argv[1]), input_image);

    auto input_image_view      = boost::gil::view(input_image);
    auto input_image_distances = vi::segment::image_distances{input_image_view};

    auto graph        = vi::segment::build_minimum_spanning_tree(input_image_distances, 100);
    auto segmentation = vi::segment::process(
        graph, input_image_distances.image_width, input_image_distances.image_height);

    QPrinter printer{};
    printer.setOutputFormat(QPrinter::PdfFormat);
    printer.setOutputFileName("output.pdf");
    printer.setPageMargins(0, 0, 0, 0, QPrinter::Inch);

    printer.setPageSize(QPageSize(
        QSizeF(static_cast<double>(input_image_distances.image_width)  / printer.resolution(),
               static_cast<double>(input_image_distances.image_height) / printer.resolution()),
        QPageSize::Inch));

    QPainter painter{&printer};

    const QImage input_image_q = q_gil::gil_view_to_qimage(boost::gil::const_view(input_image));

    painter.drawImage(QPoint(0, 0), input_image_q);

    painter.setPen(QPen{QBrush(Qt::red), 0.0});

    for (std::size_t y = 0; y < input_image_distances.image_height - 1; ++y)
    {
        for (std::size_t x = 0; x < input_image_distances.image_width - 1; ++x)
        {
            const auto index = y * input_image_distances.image_width + x;

            if (segmentation[index] != segmentation[index + 1])
            {
                painter.drawLine(QPointF(static_cast<double>(x) + 1.0, static_cast<double>(y)),
                                 QPointF(static_cast<double>(x) + 1.0, static_cast<double>(y) + 1.0));
            }

            if (segmentation[index] != segmentation[index + input_image_distances.image_width])
            {
                painter.drawLine(QPointF(static_cast<double>(x),       static_cast<double>(y) + 1.0),
                                 QPointF(static_cast<double>(x) + 1.0, static_cast<double>(y) + 1.0));
            }
        }
    } 

    painter.end();
}
