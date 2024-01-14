#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QComboBox>
#include <QSettings>
#include <QTreeWidget>

#include "gamepassapi.h"
#include "gamepassgame.h"
#include "sgdbenums.h"
#include "xcchelper.h"
#include "steamtools.h"

class MainWindow : public QMainWindow
{
    Q_OBJECT

    public:
        MainWindow(QSettings *settings, QWidget *parent = nullptr);
        ~MainWindow();

        QString getRegion();

        QSettings *settings;
        GamepassApi *gamepass_api;
        QComboBox *region_selector;
        QAction *fetch_action;
        QAction *settings_action;
        QAction *add_to_steam_action;
        QTreeWidget *games_list;
        QMap<QString, const QPixmap*> artwork;
        SteamTools *steam_tools;



    private slots:
        void fetchActionClicked();
        void settingsActionClicked();
        void addToSteamClicked();
        void gameDetailsReceived(GamepassGame* game);
        void handleArtworkResponse(QString gameName, QString gameId, ArtworkType type, QVector<QString> artwork);
        void browserSelected(QString gameName, QString gameId, Browser* browser);
        void updateRegion();

};
#endif // MAINWINDOW_H
