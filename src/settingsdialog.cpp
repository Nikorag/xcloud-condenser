#include "../include/settingsdialog.h"

#include <iostream>
#include <QVBoxLayout>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QFormLayout>
#include <QFileDialog>
#include <QMessageBox>
#include <QModelIndex>
#include <QDirIterator>

#include "../include/xcchelper.h"

SettingsDialog::SettingsDialog(QSettings *settings, QWidget* parent) : settings(settings) {
    isSaved = true;
    ignoreBrowserChange = false;
    resize(600, 400);
    setWindowTitle(tr("Settings"));

    auto root_layout = new QHBoxLayout(this);
    root_layout->setContentsMargins(4, 4, 4, 4);
    root_layout->setSpacing(4);
    setLayout(root_layout);

    browser_list = new QTreeWidget();
    root_layout->addWidget(browser_list);
    browser_list->setColumnCount(1);
    QStringList headers;
    headers << "Browser";
    browser_list->setHeaderLabels(headers);

    connect(browser_list->selectionModel(), &QItemSelectionModel::selectionChanged, this, &SettingsDialog::browserSelected);

    QVector<Browser*> browsers = XccHelper::GetAllBrowsers(settings);

    for (Browser* browser : browsers) {
        // Access the Browser object using the pointer
        QTreeWidgetItem *browserItem = new QTreeWidgetItem(browser_list);
        browserItem->setText(0, browser->name);
    }

    auto settings_layout = new QVBoxLayout(this);
    root_layout->addLayout(settings_layout);

    auto form_layout = new QFormLayout(this);
    form_layout->setContentsMargins(12,12,12,12);
    settings_layout->addLayout(form_layout);

    flatpak_check = new QCheckBox(this);

    flatpak_check->setEnabled(false);

    connect(flatpak_check, &QCheckBox::stateChanged, this, [this](int state) {
        settingsChanged();
        if (state == Qt::Checked) {
            flatpak_id->setEnabled(true);
            browser_executable->setEnabled(false);
            select_executable_button->setEnabled(false);
            browser_executable->setText("");
        } else {
            flatpak_id->setEnabled(false);
            browser_executable->setEnabled(true);
            select_executable_button->setEnabled(true);
        }
    });

    flatpak_id = new QComboBox(this);
    flatpak_id->setEnabled(false);
    flatpak_id->addItems(XccHelper::getFlatpakIds());

    connect(flatpak_id, &QComboBox::currentIndexChanged, this, &SettingsDialog::settingsChanged);

    if (XccHelper::isFlatpakInstalled()) {
        form_layout->addRow("Is Flatpak?", flatpak_check);
        form_layout->addRow("Flatpak ID", flatpak_id);
    } else {
        flatpak_check->setVisible(false);
        flatpak_id->setVisible(false);
    }

    browser_executable = new QLineEdit(this);
    form_layout->addRow("Executable", browser_executable);
    connect(browser_executable, &QLineEdit::textChanged, this, &SettingsDialog::settingsChanged);
    browser_executable->setEnabled(false);

    select_executable_button = new QPushButton(this);
    select_executable_button->setText("Select Executable");
    connect(select_executable_button, &QPushButton::clicked, this, &SettingsDialog::selectExecutable);
    form_layout->addRow("", select_executable_button);
    select_executable_button->setEnabled(false);

    save_button = new QPushButton(this);
    save_button->setText("Save");
    settings_layout->addWidget(save_button);
    connect(save_button, &QPushButton::clicked, this, [this]() {
        saveSettings(getSelectedBrowser());
    });

    close_button = new QPushButton(this);
    close_button->setText("Close");
    settings_layout->addWidget(close_button);
    connect(close_button, &QPushButton::clicked, this, [this]() {
        if (isSaved) {
            close();
        } else {
            int shouldSave = QMessageBox::warning(nullptr, "Settings not saved", QString::fromStdString("Settings not saved, save first?"), QMessageBox::Save, QMessageBox::No);
            if (shouldSave == QMessageBox::Save) {
                saveSettings(getSelectedBrowser());
                close();
            } else {
                close();
            }
        }
    });
}

void SettingsDialog::browserSelected(const QItemSelection& selected, const QItemSelection& deselected) {
    flatpak_check->setEnabled(true);

    if (!ignoreBrowserChange) {
        if (!isSaved) {
            int shouldSave = QMessageBox::warning(nullptr, "Settings not saved", QString::fromStdString("Settings not saved, save now?"), QMessageBox::Save, QMessageBox::Cancel);
            if (shouldSave == QMessageBox::Cancel) {
                //fudge to stop the save popup again
                ignoreBrowserChange = true;
                QModelIndex deselectedIndex = deselected.indexes().first();
                browser_list->setCurrentIndex(deselectedIndex);
                ignoreBrowserChange = false;
                return;
            }
            saveSettings(deselected.indexes().at(0).data().toString());
        }


        QString selectedBrowser = selected.indexes().at(0).data().toString();
        QVariant flatpak = settings->value(selectedBrowser+"_flatpak");
        bool isFlatpak = flatpak.isValid() && flatpak.toBool();
        if (!isFlatpak) {
            select_executable_button->setEnabled(true);
            flatpak_check->setChecked(false);
            flatpak_id->setCurrentIndex(0);

            QVariant executable = settings->value(selectedBrowser+"_executable");
            if (executable.isValid()) {
                browser_executable->setText(executable.toString());
            }
        } else {
            select_executable_button->setEnabled(false);
            flatpak_check->setChecked(true);
            QVariant flatpakId = settings->value(selectedBrowser+"_flatpak_id");
            if (flatpakId.isValid()) {
                flatpak_id->setCurrentText(flatpakId.toString());
            }
            browser_executable->setText("");
        }
        isSaved = true;
    }
}

void SettingsDialog::selectExecutable() {
    QString filePattern = "All Files (*.*)";
#if __APPLE__
    filePattern = "Applications (*.app)";
#endif

    QString executable = QFileDialog::getOpenFileName(this, tr("Executable"), "", filePattern);
#if __APPLE__
    // Iterate over the files in the directory
    QDirIterator it(executable+"/Contents/MacOS", QDir::Files);

    if (it.hasNext()) {
        // Get the first file's full path
        executable = it.next();
    }
#endif
    browser_executable->setText(executable);
    qDebug() << executable;
}

void SettingsDialog::settingsChanged() {
    isSaved = false;
}

void SettingsDialog::saveSettings(QString selectedBrowser) {
    if (flatpak_check->isChecked()) {
        settings->remove(selectedBrowser+"_executable");
        settings->setValue(selectedBrowser+"_flatpak", true);
        settings->setValue(selectedBrowser+"_flatpak_id", flatpak_id->currentText());
    } else {
        settings->setValue(selectedBrowser+"_flatpak", false);
        settings->setValue(selectedBrowser+"_executable", browser_executable->text());
    }
    QMessageBox::information(this, "Saved", "Settings Saved", QMessageBox::Ok);
    isSaved = true;
}

QString SettingsDialog::getSelectedBrowser() {
    return browser_list->selectionModel()->selectedRows().at(0).data().toString();
}
