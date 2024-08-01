const express    = require('express');
const multer     = require('multer');
const ftpHandler = require('../index.js');

const app    = express();
const upload = multer();

app.post('/test-ftp', upload.single('fileUpload'), (req, res) => {
    let upf = ftpHandler.upload({
        file: req.file,
        fileName:  '112233' + req.file.originalname,
        fileDir: 'testtFile',
        allowedTypes: ['.txt']
    });

    res.send(upf);
})

app.get('/test-ftp-get', (req, res) => {
    ftpHandler.getFile(req.query.path, res);
})

app.get('/rename', upload.single('attach'), async (req, res) => {
    const oldFile = req.body.old;
    const newFile = req.body.new;

    const result = await ftpHandler.renameFile(oldFile, newFile);

    res.send(result);
})

app.get('/duplicate', upload.single('attach'), async (req, res) => {
    const oldFile = req.body.old;
    const newFile = req.body.new;

    console.log(await ftpHandler.duplicateFile(oldFile, newFile));

    res.send();
})

app.listen(3001, () => {
    console.log("Server is listening");
});