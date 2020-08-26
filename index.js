const express = require('express');
const archiver = require('archiver');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

let ziping=0;

app.use(express.static('public'));
app.use('/data', express.static('data'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/data/');
  },
  filename: function (req, file, cb) {
    cb(null,file.originalname);
  }
})
const fileFilter = (req, file, cb) =>{
  //console.log(file);
  cb(null, /.*\.(gif|jpg|jpeg|png|mp4)$/i.test(file.originalname));
}
app.post('/upload', multer({ storage: storage,fileFilter:fileFilter }).single('file'), (req, res) => {
 res.send("OK");
});

app.get('/files', function(req,res){
  let json = [];

  try{
    json = JSON.parse(fs.readFileSync(__dirname + '/data/Config.json', 'utf8'));
  } catch (error) {
  }

  fs.readdir(__dirname + '/data/', function(err, files){
    if (err) throw err;
    for(let n=0;n<files.length;n++){
      const stat=fs.statSync(__dirname + '/data/' + files[n]);
      if(stat.isFile() && /.*\.(gif|jpg|jpeg|png|mp4)$/i.test(files[n])){
        let type = 'image';
        if(/.*\.(mp4)$/i.test(files[n])){
          type = 'video';
        }
        updateJson(json,{
          name: files[n],
          size: stat.size,
          time: 5,
          "type": type
        });
      }
    }
    saveJson(json);
    res.send(JSON.stringify(json, null, '    '));
  });
  //res.send('files');
})

app.post('/save', (req,res)=>{
  //console.log(req.body);
  json = req.body;
  saveJson(json);
  delFiles(json);
  makeZip(json);
  res.send("OK");
});

delFiles = (json) => {
  fs.readdir(__dirname + '/data/', function(err, files){
    if (err) throw err;
    for(let n=0;n<files.length;n++){
      const stat=fs.statSync(__dirname + '/data/' + files[n]);
      if(stat.isFile() && /.*\.(gif|jpg|jpeg|png|mp4)$/i.test(files[n])){
        let type = 'image';
        if(/.*\.(mp4)$/i.test(files[n])){
          type = 'video';
        }
        if(isExistInJson(json,files[n])){

        }else{
          try {
            fs.unlinkSync(__dirname + '/data/' + files[n]);
            //console.log("delete: " + files[n]);
          } catch (error) {
            throw error;
          }
        }
      }
    }
  });
}

makeZip = (json) => {
  if(ziping){
    console.log('stil working..');
    return;
  }
  ziping = 1;
  const zip_file_name = "program.zip";
  try{
    fs.unlinkSync(__dirname + '/data/' + zip_file_name);
  } catch (error) {
  }

  const millis = Date.now();
  const version = {
    "version":Math.floor(millis / 1000),
    //"file":"https://mtpdb.dev.netarts.co.jp/editor1/data/
    "file":"http://127.0.0.1:3000/data/program.zip"
  };
  try {
    fs.writeFileSync(__dirname + '/data/version.json',JSON.stringify(version, null, '    '));
  }catch(e){
    console.log(e);
  }

  const archive = archiver.create('zip', {});
  const output = fs.createWriteStream(__dirname + '/data/' + zip_file_name);
  archive.pipe(output);

  archive.append(fs.createReadStream(__dirname + '/data/Config.json'), { name: 'Config.json' });

  for(let n=0;n<json.length;n++){
    archive.append(fs.createReadStream(__dirname + '/data/' + json[n].name), { name: json[n].name });
  }

  archive.finalize();
  output.on("close", function () {
    // zip圧縮完了すると発火する
    var archive_size = archive.pointer();
    console.log(`complete! total size : ${archive_size} bytes`);
    ziping=0;
  });
}

isExistInJson = (json, file) => {
  let chk=0;
  for(let n=0;n<json.length;n++){
    if(json[n].name===file){
      chk++;
    }
  }
  return chk;
}


saveJson = (json) => {
  try {
    fs.writeFileSync(__dirname + '/data/Config.json',JSON.stringify(json, null, '    '));
  }catch(e){
    console.log(e);
  }
}

updateJson = (json,data) => {
  //console.log(data);
  let chk=0;
  for(let n=0;n<json.length;n++){
    if(json[n].name===data.name){
      json[n].size = data.size;
      chk++;
    }
  }
  if(chk==0){
    json.push(data);
  }
}


app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})
