#!/usr/bin/env bash

project_name="browse-manager"
work_path=$(dirname $0)
tmp_path=".tmp4publish"

confirm(){
    echo "===Continue (y/n)?"
    read choice
    case "$choice" in
      y|Y )
        echo "===continuing..."
        ;;
      * )
        echo "===终止..."
        exit 1
        ;;
    esac
}

if git status --porcelain | grep -v "??" || git cherry -v; then
    echo "===有未提交或push的代码"
    confirm
fi

rm -rf ${work_path}/${tmp_path}; mkdir ${tmp_path}

#为了保证源码和发布版本的严格统一，从github库clone代码
git clone --depth 1 https://github.com/ZDL-Git/${project_name} ${work_path}/${tmp_path}/${project_name}
rm -rf ${work_path}/${tmp_path}/${project_name}/distribution
version=`cat ${tmp_path}/${project_name}/manifest.json | jq -r '.version'`
echo "===当前版本号 ${version}"
if [[ -f ${work_path}/${tmp_path}/${project_name}/distribution/crx/${project_name}-${version}.crx ]]
then
    echo "===已发布过此版本号"
    confirm
fi

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=${work_path}/${tmp_path}/${project_name} --pack-extension-key=${work_path}/${project_name}.pem --no-message-box

mv ${work_path}/${tmp_path}/${project_name}.crx ${work_path}/${project_name}-${version}.crx
rm -rf ${work_path}/${tmp_path}

echo "===完成"