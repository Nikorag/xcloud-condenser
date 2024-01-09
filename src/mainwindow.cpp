#include "../include/mainwindow.h"

#include <iostream>
#include <ostream>
#include <QMessageBox>
#include <QVBoxLayout>
#include <QToolBar>
#include <QTreeWidget>
#include <QStandardItem>

#include "../cmake-build-debug/_deps/cpp-steam-tools-src/include/steamtools.h"
#include "../include/browserselectdialog.h"
#include "../include/gamepassapi.h"
#include "../include/settingsdialog.h"
#include "../include/steamgriddbapi.h"
#include "../include/imageloader.h"
#include <QWidgetAction>

QMap<ArtworkType, QString> typeMap = {
    {ArtworkType::LANDSCAPE, "landscape"},
    {ArtworkType::PORTRAIT, "portrait"},
    {ArtworkType::HERO, "hero"},
    {ArtworkType::ICON, "icon"},
    {ArtworkType::LOGO, "logo"},
};

QMap<QString, QString> regionMap = {
    {"GB", "🇬🇧 United Kingdom"},
{"US", "🇺🇸 United States"}
};

MainWindow::MainWindow(QSettings *settings, QWidget *parent) : QMainWindow(parent), settings(settings)
{
    //Create steam tools
    auto infoLambda = [this](const QString &infoMessage) {
        std::cout << infoMessage.toStdString() << std::endl;
    };

    auto errorLambda = [this](const QString &errorMessage) {
        std::cerr << errorMessage.toStdString() << std::endl;
    };
    steam_tools = new SteamTools(infoLambda, errorLambda);

    resize(800, 600);

    gamepass_api = new GamepassApi(getRegion());
    connect(gamepass_api, &GamepassApi::gameDetails, this, &MainWindow::gameDetailsReceived);

    setWindowTitle("Xcloud-Condenser");
    auto main_widget = new QWidget(this);
    auto layout = new QVBoxLayout();
    main_widget->setLayout(layout);
    setCentralWidget(main_widget);
    layout->setContentsMargins(0, 0, 0, 0);

    auto tool_bar = new QToolBar(this);
    tool_bar->setMovable(false);
    addToolBar(tool_bar);
    setUnifiedTitleAndToolBarOnMac(true);

    fetch_action = new QAction("Fetch", this);
    tool_bar->addAction(fetch_action);
    connect(fetch_action, &QAction::triggered, this, &MainWindow::fetchActionClicked);

    settings_action = new QAction("Settings", this);
    tool_bar->addAction(settings_action);
    connect(settings_action, &QAction::triggered, this, &MainWindow::settingsActionClicked);

    add_to_steam_action = new QAction("Add To Steam", this);
    tool_bar->addAction(add_to_steam_action);
    connect(add_to_steam_action, &QAction::triggered, this, &MainWindow::addToSteamClicked);

    // Create a custom widget for the right-hand side
    QWidget *customWidget = new QWidget(this);
    QHBoxLayout *tb_layout = new QHBoxLayout(customWidget);
    tb_layout->addStretch();  // Add stretch to push the label to the right

    // Create a widget action to add the custom widget to the toolbar
    QWidgetAction *widgetAction = new QWidgetAction(this);
    widgetAction->setDefaultWidget(customWidget);

    // Add the widget action to the toolbar
    tool_bar->addAction(widgetAction);

    // Create a combobox
    region_selector = new QComboBox(this);

    // Add items to the combobox
    for (const auto& key : regionMap.keys()) {
        region_selector->addItem(regionMap.value(key), key);
    }
    region_selector->setCurrentText(regionMap.value(getRegion()));

    // Add the combobox to the toolbar
    tool_bar->addWidget(region_selector);
    region_selector->setToolTip("Select a region");

    // Connect a slot to handle combobox item changes
    connect(region_selector, &QComboBox::currentIndexChanged, this, [settings,this]() {
        settings->setValue("region", region_selector->currentData().toString());
        updateRegion();
        fetchActionClicked();
    });

    games_list = new QTreeWidget();
    layout->addWidget(games_list);
    games_list->setColumnCount(2);
    QStringList headers;
    headers << "Game ID" << "Name";
    games_list->setHeaderLabels(headers);

    fetchActionClicked();
}

void MainWindow::fetchActionClicked() {
    games_list->clear();
    gamepass_api->getGames();
}

void MainWindow::settingsActionClicked() {
    SettingsDialog* dialog = new SettingsDialog(settings, this);
    dialog->exec();
}

void MainWindow::addToSteamClicked() {
    artwork.clear();
    // Get the item from the index
    QTreeWidgetItem* selectedItem = games_list->currentItem();
    // Get the data from the second column (column index 1)
    QString gameName = selectedItem->text(1);
    QString gameId = selectedItem->text(0);
    for (const auto& key : typeMap.keys()) {
        SteamGridDb* api = new SteamGridDb();
        connect(api, &SteamGridDb::handleArtworkResponse, this, [this,gameId, gameName, key](QVector<QString> artwork) {
            handleArtworkResponse(gameName, gameId, key, artwork);
        });
        api->getGameArtwork(gameName, key);
    }
}

void MainWindow::gameDetailsReceived(GamepassGame* game) {
    QTreeWidgetItem *gameItem = new QTreeWidgetItem(games_list);
    gameItem->setText(0, game->id);
    gameItem->setText(1, game->name);
    games_list->sortByColumn(1, Qt::AscendingOrder);
}

void MainWindow::handleArtworkResponse(QString gameName, QString gameId, ArtworkType type, QVector<QString> urlList) {
    //Now we need to download the artwork to a pixmap
    ImageLoader* loader = new ImageLoader(this);
    connect(loader, &ImageLoader::imageLoaded, this, [this, gameId, gameName, type](QPixmap pixmap) {
        QPixmap* pixmap_ptr = new QPixmap(pixmap.copy());
        artwork.insert(typeMap.value(type), pixmap_ptr);
        if (artwork.count() == 5) {
            BrowserSelectDialog* dialog = new BrowserSelectDialog(settings, this);
            connect(dialog, &BrowserSelectDialog::browserSelected, this, [this, gameId, gameName](Browser* browser) {
                browserSelected(gameName, gameId, browser);
            });
            dialog->exec();
        }
    });
    if (urlList.length() > 0) {
        loader->loadImage(urlList.at(0));
    } else {
        artwork.insert("missing_"+typeMap.value(type), nullptr);
    }

}

void MainWindow::updateRegion() {
    gamepass_api->setRegion(getRegion());
    games_list->clear();
    artwork.clear();
}

QString MainWindow::getRegion() {
    QVariant region = settings->value("region");
    if (region.isValid()) {
        return region.toString();
    }
    return "GB";
}

void MainWindow::browserSelected(QString gameName, QString gameId, Browser* browser) {
    QVector<SteamShortcutEntry> existingEntries = steam_tools->parseShortcuts();
    //Look for existing entry
    for (SteamShortcutEntry entry : existingEntries) {
        if (entry.getLaunchOptions().contains("https://www.xbox.com/en-GB/play/launch/"+gameId)) {
            QMessageBox::warning(nullptr, "Already in Steam", gameName+" from XCloud already found in steam, not adding", QMessageBox::Ok);
            return;
        }
    }
    QString launchOptions = QString(browser->launchOptionsTemplate).arg("https://www.xbox.com/en-GB/play/launch/"+gameId);
    SteamShortcutEntry newEntry = steam_tools->buildShortcutEntry(gameName, browser->executable, launchOptions, artwork);
    existingEntries.append(newEntry);
    steam_tools->updateShortcuts(existingEntries);
    QMessageBox::information(nullptr, "Added to Steam", "Added "+gameName+" to Steam. Please restart Steam", QMessageBox::Ok);
}

MainWindow::~MainWindow()
{

}
