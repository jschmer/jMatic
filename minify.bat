REM requires nodejs uglifyjs module!
REM npm install uglify-js -g

start uglifyjs js\jsExtensions.js js\lang.js js\common.js js\XMLparsing.js js\data.js js\jMaticController.js js\compiled_templates.js js\userdefined_groups.js -o jMatic.min.js --source-map jMatic.min.js.map -p relative -c -m
