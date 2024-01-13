#!/bin/bash

set -xe

# sometimes there are errors in linuxdeploy in docker/podman when the appdir is on a mount
appdir=${1:-`pwd`/appimage/appdir}

mkdir appimage

pip3 install --user protobuf==3.19.5
rm -rf /usr/bin/meson
pip3 install meson==1.3.0
scripts/fetch-protoc.sh appimage
export PATH="`pwd`/appimage/protoc/bin:$PATH"
scripts/build-ffmpeg.sh appimage
scripts/build-sdl2.sh appimage
scripts/build-libplacebo.sh appimage

mkdir build_appimage
cd build_appimage 
cmake \
	-GNinja \
	-DCMAKE_BUILD_TYPE=Release \
	"-DCMAKE_PREFIX_PATH=`pwd`/../appimage/ffmpeg-prefix;`pwd`/../appimage/sdl2-prefix;/opt/qt515" \
	-DCHIAKI_ENABLE_TESTS=ON \
	-DCHIAKI_ENABLE_GUI=ON \
	-DCHIAKI_GUI_ENABLE_SDL_GAMECONTROLLER=ON \
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

export LD_LIBRARY_PATH="`pwd`/sdl2-prefix/lib:`pwd`/libplacebo/build/src:$LD_LIBRARY_PATH"
export EXTRA_QT_PLUGINS=opengl

./linuxdeploy-x86_64.AppImage --appdir="${appdir}" -e "${appdir}/usr/bin/xcloud-condenser" -d "${appdir}/usr/share/applications/xcloud-condenser.desktop" --plugin qt --output appimage
mv xcloud-condenser-x86_64.AppImage Chiaki4deck.AppImage
