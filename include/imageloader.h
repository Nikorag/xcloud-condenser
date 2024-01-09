#ifndef IMAGELOADER_H
#define IMAGELOADER_H
#include <QDialog>
#include <QCheckBox>
#include <QLineEdit>
#include <QComboBox>
#include <qeventloop.h>
#include <QNetworkAccessManager>
#include <QNetworkReply>

class ImageLoader : public QObject {
    Q_OBJECT
public:
    explicit ImageLoader(QObject* parent);

    void loadImage(const QString& url);

    public slots:
        void onRequestFinished(QNetworkReply* reply);

    signals:
        void imageLoaded(QPixmap pixmap);

    private:
        QNetworkAccessManager* networkManager;
};

#endif //IMAGELOADER_H
