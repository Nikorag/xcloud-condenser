#include "../include/steamgriddbapi.h"

#include <QJsonArray>
#include <QJsonObject>
#include <QNetworkReply>

#include "../include/jsonrequester.h"

SteamGridDb::SteamGridDb(QObject* parent) {
    apiRoot = "https://www.steamgriddb.com/api/v2";
    apiKey = "112c9e0822e85e054b87793e684b231a"; //API Key for @Nikorag
}

void SteamGridDb::getArtwork(QString gameId, ArtworkType type, int page) {
    switch(type) {
        case ArtworkType::LANDSCAPE:
            getLandscapes(gameId, page);
            break;
        case ArtworkType::PORTRAIT:
            getPortraits(gameId, page);
            break;
        case ArtworkType::HERO:
            getHeroes(gameId, page);
            break;
        case ArtworkType::ICON:
            getIcons(gameId, page);
            break;
        case ArtworkType::LOGO:
            getLogos(gameId, page);
            break;
    }
}

void SteamGridDb::getLandscapes(QString gameId, int page) {
    requestArtwork("grids", "&dimensions=460x215,920x430", gameId, page);
}

void SteamGridDb::getPortraits(QString gameId, int page) {
    requestArtwork("grids", "&dimensions=600x900", gameId, page);
}

void SteamGridDb::getHeroes(QString gameId, int page) {
    requestArtwork("heroes", "", gameId, page);
}

void SteamGridDb::getLogos(QString gameId, int page) {
    requestArtwork("logos", "", gameId, page);
}

void SteamGridDb::getIcons(QString gameId, int page) {
    requestArtwork("icons", "", gameId, page);
}

void SteamGridDb::getGameArtwork(QString searchTerm, ArtworkType type) {
    QString url = QString("%1/search/autocomplete/%2")
        .arg(apiRoot)
        .arg(searchTerm);
    QString bearerToken = JsonRequester::generateBearerAuthHeader(apiKey);
    JsonRequester* requester = new JsonRequester(this);
    connect(requester, &JsonRequester::requestFinished, this, [this, type, searchTerm](const QString& url, const QJsonDocument jsonDocument) {
        handleSearchResponse(type, searchTerm, jsonDocument);
    });
    connect(requester, &JsonRequester::requestError, this, [](const QString& url, const QNetworkReply::NetworkError& error) {
        std::cout << error << std::endl;
    });
    requester->makeGetRequest(url, bearerToken);
}

void SteamGridDb::handleSearchResponse(ArtworkType type, QString searchTerm, const QJsonDocument jsonDocument) {
    QJsonObject resultObject = jsonDocument.object();
    QJsonArray resultData = resultObject.value("data").toArray();

    for (int i = 0; i < resultData.size(); ++i) {
        QJsonObject game = resultData.at(i).toObject();
        QString gameName = game.value("name").toString();
        if (gameName == searchTerm) {
            std::cout << QJsonDocument(game).toJson().toStdString() << std::endl;
            QString gameId = QString::number(game.value("id").toInt());
            getArtwork(gameId, type, 0);
        }
    }
}

void SteamGridDb::requestArtwork(QString type, QString queryParams, QString gameId, int page) {
    QString url = QString("%1/%2/game/%3?page=%4%5")
        .arg(apiRoot)
        .arg(type)
        .arg(gameId)
        .arg(QString::number(page))
        .arg(queryParams);

    QString bearerToken = JsonRequester::generateBearerAuthHeader(apiKey);
    JsonRequester* requester = new JsonRequester(this);
    connect(requester, &JsonRequester::requestFinished, this, &SteamGridDb::handleJsonResponse);
    connect(requester, &JsonRequester::requestError, this, [](const QString& url, const QNetworkReply::NetworkError& error) {
        std::cout << error << std::endl;
    });
    requester->makeGetRequest(url, bearerToken);
}

void SteamGridDb::handleJsonResponse(const QString& url, const QJsonDocument jsonDocument) {
    QVector<QString> result_vector;
    QJsonObject resultObject = jsonDocument.object();
    QJsonArray resultData = resultObject.value("data").toArray();


    for (QJsonArray::iterator it = resultData.begin(); it != resultData.end(); ++it) {
        QJsonObject gameObject = it->toObject();
        QString imageUrl = gameObject.value("url").toString();

        result_vector.append(imageUrl);
    }

    emit handleArtworkResponse(result_vector);
}
