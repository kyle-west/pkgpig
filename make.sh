rm -rf node_modules/ >/dev/null

defaultPkgName=`basename $(pwd)`
defaultUsername="kyle-west"

read -p "cli-name: ($defaultPkgName)" pkgName
read -p "author github username: ($defaultUsername)" username
read -p "description: " description

pkgName="${pkgName:-$defaultPkgName}"
username="${username:-$defaultUsername}"

echo "building $pkgName..."

find . -mindepth 1 -maxdepth 1 -exec sed -i '' "s#__REPLACE_PACKAGE_NAME_WITH_MAKE_CMD__#$pkgName#g" {} \;
find . -mindepth 1 -maxdepth 1 -exec sed -i '' "s#__REPLACE_DESCRIPTION_WITH_MAKE_CMD__#$description#g" {} \;
find . -mindepth 1 -maxdepth 1 -exec sed -i '' "s#kyle-west#$username#g" {} \;


echo "# $pkgName

![Status Badge](https://github.com/$username/$pkgName/workflows/Install%20and%20Test%20Flow/badge.svg)

$description

## CLI


Example CLI command

\`\`\`
$pkgName test <action> <type> [rest...]
\`\`\`


## Contributing

Run the following to test / dev locally:
\`\`\`
npm install
npm link
\`\`\`

" > README.md

rm make.sh
