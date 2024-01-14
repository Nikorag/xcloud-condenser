#!/bin/bash

set -xe

# sometimes there are errors in linuxdeploy in docker/podman when the appdir is on a mount
appdir=${1:-`pwd`/appimage/appdir}

mkdir appimage

mkdir build_appimage
cd build_appimage 
cmake \
	-GNinja \
	-DCMAKE_BUILD_TYPE=Release \
	"-DCMAKE_PREFIX_PATH=/opt/qt515" \
	-DCMAKE_INSTALL_PREFIX=/usr \
	..
cd ..


ninja -C build_appimage

DESTDIR="${appdir}" ninja -C build_appimage install
cd appimage

curl -L -O https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage
chmod +x linuxdeploy-x86_64.AppImage
curl -L -O https://github.com/linuxdeploy/linuxdeploy-plugin-qt/releases/download/continuous/linuxdeploy-plugin-qt-x86_64.AppImage
chmod +x linuxdeploy-plugin-qt-x86_64.AppImage

export EXTRA_QT_PLUGINS=opengl

./linuxdeploy-x86_64.AppImage --appdir="${appdir}" -e "${appdir}/usr/bin/xcloud-condenser" -d "${appdir}/usr/share/applications/xcloud-condenser.desktop" --plugin qt --output appimage
mv xcloud-condenser-x86_64.AppImage Chiaki4deck.AppImage
