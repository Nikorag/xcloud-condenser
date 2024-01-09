#ifndef SETTINGSDIALOG_H
#define SETTINGSDIALOG_H

#include <QCheckBox>
#include <QDialog>
#include <QLabel>
#include <QTreeWidget>
#include <QLineEdit>
#include <QSettings>
#include <QPushButton>
#include <QComboBox>


class SettingsDialog : public QDialog {
    Q_OBJECT

    public:
        bool isSaved;
        bool ignoreBrowserChange;
        SettingsDialog(QSettings *settings, QWidget* parent = nullptr);
        QSettings *settings;
        QTreeWidget *browser_list;
        QCheckBox *flatpak_check;
        QComboBox *flatpak_id;
        QLineEdit *browser_executable;
        QPushButton *select_executable_button;
        QPushButton *save_button;
        QPushButton *close_button;
        void saveSettings(QString browser);

    private:
        QString getSelectedBrowser();

    public slots:
        void browserSelected(const QItemSelection &selected, const QItemSelection &deselected);
        void selectExecutable();
        void settingsChanged();
};



#endif //SETTINGSDIALOG_H
