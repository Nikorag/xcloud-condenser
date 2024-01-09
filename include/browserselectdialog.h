#ifndef BROWSERSELECTDIALOG_H
#define BROWSERSELECTDIALOG_H
#include <QComboBox>
#include <QDialog>
#include <QSettings>
#include <QPushButton>

#include "xcchelper.h"

class BrowserSelectDialog : public QDialog {
    Q_OBJECT

    public:
        BrowserSelectDialog(QSettings* settings, QWidget* parent);
        QComboBox *browser_select_box;
        QPushButton *ok_button;
        QPushButton *cancel_button;

    signals:
        void browserSelected(Browser* brwoser);
};

#endif //BROWSERSELECTDIALOG_H
