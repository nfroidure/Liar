#! /bin/sh
# Build and eventually send to production server

# Keep old dir
oldPwd=$(pwd)
# 
cd "$(dirname $0)/www";
# Comment RequireJS script tag
sed -i "s/DEV-->/DEV--/g" index.html
# Uncomment production script tag
sed -i "s/PROD--/PROD-->/g" index.html
# Run r.js
if [ "$1" = "prod" ]; then
	# Production
	r.js -o baseUrl=./javascript/ name=Application out=javascript/production.js
else
	# Debug
	r.js -o baseUrl=./javascript/ name=Application out=javascript/production.js optimize=none
fi
# Adding a simple closure
prodContent=$(cat javascript/production.js)
echo "(function() {\n\n$prodContent\n\n}).call({})" > javascript/production.js
# Sending if server given
if [ "$2" != "" ]; then
	cd "$(dirname $0)"
	rsync -Haurov --exclude=/.git/ --exclude=/node_modules/ . "$2:/home/liar/"
fi
# Back to the right pwd
cd "$olPwd"
