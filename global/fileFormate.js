/**
 * Created by renminghe on 2017/7/12.
 */
const path = require('path');
const fs = require('fs');
'use strict';

module.exports = {
    
    // 重命名文件名
    renameFile: (files) => {
        let date = new Date();
        let dataStr = `${date.getFullYear()}-${date.getMonth() + 1}`;
        let pathStr = path.join(__dirname, `/../public/${dataStr}/`);
        let pathMap = {};
        
        Object.keys(files).forEach(data => {
            if (data && files[data].hasOwnProperty("path")) {
                try {
                    let stat = fs.existsSync(pathStr);
                    let file_path = "";
                    if (!stat) {
                        fs.mkdirSync(pathStr);
                        let source = fs.readFileSync(path.join(files[data]["path"]), "utf-8");
                        file_path = `${pathStr}${new Date().getTime()}%^${files[data]["originalFilename"]}`;
                        fs.writeFileSync(file_path, source)
                    } else {
                        let source = fs.readFileSync(path.join(files[data]["path"]), "utf-8");
                        file_path = `${pathStr}${new Date().getTime()}%^${files[data]["originalFilename"]}`;
                        fs.writeFileSync(file_path, source)
                    }
                    pathMap[files[data]["fieldName"]] = file_path;
                    fs.unlinkSync(path.join(files[data]["path"]));
                } catch (err) {
                    throw err;
                }
                
                
            }
        });
        return pathMap;
    },
    
    // 下载附件方法
    download: (res, path) => {
        let file_path = fs.existsSync(path);
        if (file_path) {
            let source = fs.readFileSync(path, "utf-8");
            let file_name = path.substring(path.lastIndexOf("%^") + 2);
            let file_path_name = path.substring(0, path.lastIndexOf("/"));
            let file_path_temp = `${file_path_name}/${file_name}`;
            fs.writeFileSync(file_path_temp, source);
            res.download(file_path_temp, (err => {
                fs.unlinkSync(file_path_temp);
                if (err) throw err;
            }));
        } else {
            res.createFailure();
        }
    }
};


