#include "../include/browserselectdialog.h"

#include <QVBoxLayout>

#include "../include/xcchelper.h"

BrowserSelectDialog::BrowserSelectDialog(QSettings* settings, QWidget* parent) {
    QVector<Browser*> browsers = XccHelper::GetAllBrowsers(settings);
    resize(400, 100);
    setWindowTitle(tr("Select Browser"));

    auto root_layout = new QVBoxLayout(this);
    root_layout->setContentsMargins(4, 4, 4, 4);
    root_layout->setSpacing(4);
    setLayout(root_layout);

    browser_select_box = new QComboBox(this);
    ok_button = new QPushButton(this);
    ok_button->setEnabled(false);
    for (Browser* browser : browsers) {
        if (browser->complete) {
            ok_button->setEnabled(true);
            browser_select_box->addItem(browser->name);
        }
    }
    root_layout->addWidget(browser_select_box);

    auto button_layout = new QHBoxLayout(this);
    root_layout->addLayout(button_layout);


    ok_button->setText("Ok");
    button_layout->addWidget(ok_button);
    connect(ok_button, &QPushButton::clicked, this, [this, browsers]() {
        for (Browser* browser : browsers) {
            if (browser->name == browser_select_box->currentText()) {

                emit browserSelected(browser);
            }
        }
        close();
    });

    cancel_button = new QPushButton(this);
    button_layout->addWidget(cancel_button);
    cancel_button->setText("Cancel");
    connect(cancel_button, &QPushButton::clicked, this, [this]() {
        close();
    });
}