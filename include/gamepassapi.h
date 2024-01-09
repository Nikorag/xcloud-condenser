#ifndef GAMEPASSAPI_H
#define GAMEPASSAPI_H

#include <QObject>
#include <QJsonDocument>

#include "gamepassgame.h"
#include "jsonrequester.h"


class GamepassApi : public QObject {
    Q_OBJECT
    public:
       explicit GamepassApi(QString region);
       void getGames();
       void setRegion(QString region);

    private:
        JsonRequester* list_requester;
        JsonRequester* detail_requester;
        QString region;

    private slots:
        void gamesListResponse(QString uri, QJsonDocument json);
        void gameDetailResponse(QString uri, QJsonDocument json);

    signals:
        void gameDetails(GamepassGame* game);
};



#endif //GAMEPASSAPI_H
