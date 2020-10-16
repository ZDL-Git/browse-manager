#!/usr/bin/env bash
#####################
# 本地开发文件打包
#####################

project_name="browse-manager"
work_path=$(dirname $0)
tmp_path=".tmp4publish"

rm -rfv ${work_path}/${tmp_path}
rsync -rv --exclude=.git --exclude=distribution --exclude=.idea --exclude=others --exclude=.gitignore ${work_path}/../../${project_name} ${work_path}/${tmp_path}

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=${work_path}/${tmp_path}/${project_name} --pack-extension-key=${work_path}/${project_name}.pem --no-message-box
mv ${work_path}/${tmp_path}/${project_name}.crx ${work_path}/${project_name}-$(date +"%m%d_%H%M")-beta.crx

rm -rf ${work_path}/${tmp_path}
