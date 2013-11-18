#!/bin/sh
                          
for file in *.tmx *.json *.tsx
do
echo $file
sed -e "s_\.\.\\\\/assets\\\\/__g" $file > /tmp/tempfile.tmp
sed -e "s_\.\./assets/__g" /tmp/tempfile.tmp > /tmp/tempfile2.tmp
mv /tmp/tempfile2.tmp $file
done
