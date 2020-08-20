const express = require('express');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/data', express.static('data'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'data/');
  },
  filename: function (req, file, cb) {
    cb(null,file.originalname);
  }
})
const fileFilter = (req, file, cb) =>{
  console.log(file);
  cb(null, /.*\.(gif|jpg|jpeg|png|mp4)$/i.test(file.originalname));
}
app.post('/upload', multer({ storage: storage,fileFilter:fileFilter }).single('file'), (req, res) => {
 res.send("OK");
});

app.get('/files', function(req,res){
  let json = [];

  try{
    json = JSON.parse(fs.readFileSync('data/Config.json', 'utf8'));
  } catch (error) {
  }

  fs.readdir('data/', function(err, files){
    if (err) throw err;
    for(let n=0;n<files.length;n++){
      const stat=fs.statSync('data/' + files[n]);
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
  console.log(req.body);
  json = req.body;
  saveJson(json);
  delFiles(json);
  res.send("OK");
});

delFiles = (json) => {
  fs.readdir('data/', function(err, files){
    if (err) throw err;
    for(let n=0;n<files.length;n++){
      const stat=fs.statSync('data/' + files[n]);
      if(stat.isFile() && /.*\.(gif|jpg|jpeg|png|mp4)$/i.test(files[n])){
        let type = 'image';
        if(/.*\.(mp4)$/i.test(files[n])){
          type = 'video';
        }
        if(isExistInJson(json,files[n])){

        }else{
          try {
            fs.unlinkSync('data/' + files[n]);
            console.log("delete: " + files[n]);
          } catch (error) {
            throw error;
          }
        }
      }
    }
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
    fs.writeFileSync('data/Config.json',JSON.stringify(json, null, '    '));
  }catch(e){
    console.log(e);
  }
}

updateJson = (json,data) => {
  console.log(data);
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
