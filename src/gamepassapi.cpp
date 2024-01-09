#include "../include/gamepassapi.h"

#include <iostream>
#include <QJsonArray>
#include <QJsonObject>

#include "../include/jsonrequester.h"

GamepassApi::GamepassApi(QString region) : region(region){
    list_requester = new JsonRequester(this);
    connect(list_requester, &JsonRequester::requestFinished, this, &GamepassApi::gamesListResponse);
    detail_requester = new JsonRequester(this);
    connect(detail_requester, &JsonRequester::requestFinished, this, &GamepassApi::gameDetailResponse);
}

void GamepassApi::setRegion(QString inputRegion) {
    region = inputRegion;
}

void GamepassApi::getGames() {
    QString url = QString("https://catalog.gamepass.com/sigls/v2?id=f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e&language=en-us&market=%1").arg(region);
    list_requester->makeGetRequest(url, "", "application/json");
}

void GamepassApi::gamesListResponse(QString uri, QJsonDocument json) {
    QStringList gameIDs;
    QJsonArray array = json.array();
    for (const QJsonValue& value : array) {
        QJsonObject object = value.toObject();
        if (object.contains("id")) {
            QString id = object.value("id").toString();
            QString detailsUrl = QString("https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=%2&market=%1&languages=en-us&MS-CV=DGU1mcuYo0WMMp")
                .arg(region)
                .arg(id);
            detail_requester->makeGetRequest(detailsUrl, "", "application/json");
        }
    }
}

void GamepassApi::gameDetailResponse(QString uri, QJsonDocument json) {


    QJsonArray productsArray = json.object().value("Products").toArray();
    QJsonObject product = productsArray.at(0).toObject();

    QString jsonString = QJsonDocument(product).toJson(QJsonDocument::Indented);

    //ID
    QString productId = product.value("ProductId").toString();

    //Title
    QJsonObject localizedProperties = product.value("LocalizedProperties").toArray().at(0).toObject();
    QString productTitle = localizedProperties.value("ProductTitle").toString();

    GamepassGame* game = new GamepassGame(productId);
    game->name = productTitle;

    emit gameDetails(game);
}


