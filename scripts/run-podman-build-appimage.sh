#!/bin/bash

set -xe
cd "`dirname $(readlink -f ${0})`"

podman build -t xcloud-condenser-jammy . -f Dockerfile.jammy
cd ..
podman run --rm \
	--name="github-build" \
	-v "`pwd`:/build/xcloud-condenser" \
	-w "/build/xcloud-condenser" \
	--device /dev/fuse \
	--cap-add SYS_ADMIN \
	-t xcloud-condenser-jammy \
	/bin/bash -c "scripts/build-appimage.sh /build/appdir"

