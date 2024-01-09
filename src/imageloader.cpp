#include <QLabel>
#include "../include/imageloader.h"

ImageLoader::ImageLoader(QObject* parent) : QObject(parent), networkManager(new QNetworkAccessManager(this)) {
    connect(networkManager, &QNetworkAccessManager::finished, this, &ImageLoader::onRequestFinished);
}

void ImageLoader::loadImage(const QString& url) {
    {
        QUrl qurl = QUrl(url);
        QNetworkRequest request(qurl);

        networkManager->get(request);
    }
}

void ImageLoader::onRequestFinished(QNetworkReply* reply) {
    if (reply->error() == QNetworkReply::NoError) {
        // Load the image into QPixmap and set it as the label's pixmap
        QPixmap pixmap;
        pixmap.loadFromData(reply->readAll());
        emit imageLoaded(pixmap);
    }

    // Clean up
    reply->deleteLater();
}
