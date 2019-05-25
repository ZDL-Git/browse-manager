#!/usr/bin/env bash

project_name="browse-manager"
work_path=$(dirname $0)
tmp_path=".tmp4publish"

if git status --porcelain | grep -v "??"; then
    echo "有未提交的代码，请先完成push！"
    exit 1
fi

rm -rfv ${work_path}/${tmp_path}; mkdir ${tmp_path}
git clone https://github.com/ZDL-Git/${project_name} ${work_path}/${tmp_path}/${project_name}
rm -rf ${work_path}/${tmp_path}/${project_name}/distribution

version=`cat ${tmp_path}/${project_name}/manifest.json | jq -r '.version'`
echo "当前版本号 ${version}"

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=${work_path}/${tmp_path}/${project_name} --pack-extension-key=${work_path}/${project_name}.pem --no-message-box
mv ${work_path}/${tmp_path}/${project_name}.crx ${work_path}/${project_name}-${version}.crx

rm -rf ${work_path}/${tmp_path}
