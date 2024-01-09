#ifndef STEAMGRIDDBAPI_H
#define STEAMGRIDDBAPI_H

#include <iostream>
#include <map>
#include <QJsonDocument>
#include <QObject>
#include <string>

#include "sgdbenums.h"

class SteamGridDb : public QObject {
    Q_OBJECT

    public:
        QString apiRoot;
        QString apiKey;
        explicit SteamGridDb(QObject* parent = nullptr);
        void getArtwork(QString gameId, ArtworkType type, int page);
        void getGameArtwork(QString searchTerm, ArtworkType type);

    private:
        void requestArtwork(QString type, QString queryParams, QString gameId, int page);
        void getLandscapes(QString gameId, int page);
        void getPortraits(QString gameId, int page);
        void getHeroes(QString gameId, int page);
        void getLogos(QString gameId, int page);
        void getIcons(QString gameId, int page);

    public slots:
        void handleJsonResponse(const QString& url, const QJsonDocument jsonDocument);
        void handleSearchResponse(ArtworkType type, QString searchTerm, const QJsonDocument jsonDocument);

    signals:
        void handleArtworkResponse(QVector<QString> artwork);
};

#endif // STEAMGRIDDBAPI_H