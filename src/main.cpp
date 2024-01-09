#include "../include/mainwindow.h"

#include <QApplication>
#include <QSettings>

int main(int argc, char *argv[])
{
    QCoreApplication::setOrganizationName("Nikorag");
    QCoreApplication::setApplicationName("Xcloud Condenser");
    QSettings* settings = new QSettings();

    QApplication a(argc, argv);
    MainWindow w(settings);
    w.show();
    return a.exec();
}
