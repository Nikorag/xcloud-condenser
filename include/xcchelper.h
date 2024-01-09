#ifndef XCCHELPER_H
#define XCCHELPER_H
#include <QJsonDocument>
#include <QJsonObject>
#include <QtCore/QIODevice>
#include <QFile>
#include <QProcess>

class Browser {
    public:
        bool complete;
        QString name;
        QString executable;
        QString launchOptionsTemplate;
};

namespace XccHelper {
    static QString getFlatpakExecutable() {
        QProcess process;
        process.start("which flatpak");
        process.waitForFinished();

        return process.readAllStandardOutput();
    }

    static bool isFlatpakInstalled() {
        // Use a simple command to check if Flatpak is installed
        QProcess process;
        process.start("flatpak --version");
        process.waitForFinished();

        //return process.exitCode() == 0;
        return true;
    }

    static QStringList getFlatpakIds() {
        // Use a command to get a list of available Flatpak IDs
        QProcess process;
        process.start("flatpak list --app --columns=application");
        process.waitForFinished();

        // Parse the output and return a list of IDs
        QString output = process.readAllStandardOutput();
        QStringList allIds = output.split('\n');

        // Filter out empty strings
        QStringList filteredIds;
        for (const QString &str : allIds) {
            if (!str.isEmpty()) {
                filteredIds.append(str);
            }
        }

        filteredIds << "com.jamie.test" << "com.leigh.test" << "com.oakley.test";

        return filteredIds;
    }

    static QJsonDocument parseJsonFile(const QString &filePath) {
        QFile file(filePath);

        if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
            qDebug() << "Failed to open the file for reading:" << file.errorString();
            return QJsonDocument(); // Return an empty QJsonDocument on failure
        }

        QByteArray jsonData = file.readAll();
        file.close();

        QJsonParseError parseError;
        QJsonDocument jsonDoc = QJsonDocument::fromJson(jsonData, &parseError);

        if (parseError.error != QJsonParseError::NoError) {
            qDebug() << "Failed to parse JSON:" << parseError.errorString();
            return QJsonDocument(); // Return an empty QJsonDocument on failure
        }

        return jsonDoc;
    }

    static QVector<Browser*> GetAllBrowsers(QSettings* settings) {
        QVector<Browser*> response;
        QJsonDocument browserConfig = parseJsonFile(":/json/browsers.json");

        QJsonObject browsersObj = browserConfig.object();

        for (auto it = browsersObj.begin(); it != browsersObj.end(); ++it) {
            QString key = it.key();  // Get the key

            Browser* b = new Browser();
            b->complete = false;
            b->name = key;
            b->launchOptionsTemplate = browsersObj.value(it.key()).toObject().value("launchOptions").toString();
            QVariant isFlatpak = settings->value(b->name+"_flatpak");
            if (isFlatpak.isValid() && isFlatpak.toBool()) {
                QVariant flatpak_id = settings->value(b->name+"flatpak_id");
                if (flatpak_id.isValid()) {
                    b->executable = getFlatpakExecutable();
                    b->launchOptionsTemplate.prepend(QString("run --branch=stable --arch=x86_64 --command=/app/bin/chrome --file-forwarding %1 @@u @@ ").arg(flatpak_id.toString()));
                    b->complete = true;
                }
            } else {
                QVariant executable = settings->value(b->name+"_executable");
                if (executable.isValid()) {
                    b->executable = executable.toString();
                    b->complete = true;
                }
            }
            response.append(b);
        }
        return response;
    }
}

#endif //XCCHELPER_H
