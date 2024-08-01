const ftp           = require('ftp');
const fs            = require('fs');
const path          = require('path');
const { ftpConfig } = require('./config.js');
const { EventEmitter } = require('stream');

const rootPath = '/File Sharing/';


function _connect() {
    const ftpClient = new ftp()

    ftpClient.connect(ftpConfig);

    return ftpClient;
}
    

exports.upload = ({file, fileName, fileDir, allowedTypes = []}) => {

    /*
    * Declare
    */
    var fileDest = file.originalname;
    var fileExt  = path.extname(file.originalname);

    if (fileName != null) {
        fileDest = fileName + fileExt;
    }

    if (fileDir != null) {
        fileDest = fileDir + '/' + fileDest;
    }

    fileDest = rootPath + fileDest;

    if (allowedTypes.length != 0) {
        if (allowedTypes.includes(fileExt.toLowerCase()) == false) {
            throw 'Format File Tidak Diizinkan';
        }
    }

    /*
    * Progress
    */
    const ftpClient = _connect();

    ftpClient.on('ready', function() {
        var dirPath  = rootPath + fileDir;

        ftpClient.list(dirPath, (errList, data) => {
            if (errList?.message.indexOf('No such file or directory') < 0) {
                throw 'Gagal mendapatkan list folder'
            }

            if (data === undefined) {
                ftpClient.mkdir(dirPath, (errMkdir) => {
                    if (errMkdir) throw `Folder '${fileDir}' gagal dibuat`;
                });
            }

            ftpClient.put(file.buffer, fileDest, (err) => {
                if (err) throw err;
                ftpClient.end();
            });
        });
    })

    return fileDest;
}

exports.getFile = (file, res) => {

    /*
    * Progress
    */
    const ftpClient = _connect();

    ftpClient.on('ready', async function() {
        ftpClient.get(file, function(err, stream) {
            if (err) {
                res.status(500).send({
                    message: 'File Tidak Ditemukan'
                });
                ftpClient.end();
                return;
            };

            stream.once('close', function() { ftpClient.end(); });
            stream.pipe(res);
        });
    });

}

exports.renameFile = (oldPath, newPath) => {
    const result = new Promise(function(resolve, reject) {
        const ftpClient = _connect();

        ftpClient.on('ready', async function() {
            ftpClient.rename(oldPath, newPath, function(err) {
                if (err) {
                    resolve(false);
                    ftpClient.end();
                    return;
                }

                resolve(true);
                ftpClient.end();
            });
        });
    });
    

    return result;
}

exports.duplicateFile = (oldPath, newPath) => {
    const result = new Promise(function(resolve, reject) {
        const ftpClient = _connect();

        ftpClient.on('ready', async function() {
            ftpClient.get(oldPath, function(err, stream) {
                if (err) {
                    resolve(false);
                    ftpClient.end();
                    return;
                }

                const buff = [];

                stream.on('data', (chunk) => buff.push(chunk));
                stream.on('end', () => {
                     ftpClient.put(Buffer.concat(buff), newPath, (err) => {
                        if (err) {
                            resolve(false);
                            ftpClient.end();
                            return;
                        }
    
                        resolve(newPath);
                        ftpClient.end();
                    });
                });
            });
        });
    });
    

    return result;
}