let sendCount=0;

function sendFileToServer(formData,status)
{
    var uploadURL ="upload"; //Upload URL
    var extraData ={}; //Extra Data.
    sendCount++;
    var jqXHR=$.ajax({
      xhr: function() {
      var xhrobj = $.ajaxSettings.xhr();
      if (xhrobj.upload) {
            xhrobj.upload.addEventListener('progress', function(event) {
              var percent = 0;
              var position = event.loaded || event.position;
              var total = event.total;
              if (event.lengthComputable) {
                percent = Math.ceil(position / total * 100);
              }
              //Set progress
              status.setProgress(percent);
            }, false);
          }
      return xhrobj;
    },
    url: uploadURL,
    type: "POST",
    contentType:false,
    processData: false,
      cache: false,
      data: formData,
      success: function(data){
        status.setProgress(100);
        sendCount--;
        if(sendCount==0){
          loadDir();
        }
      }
    }); 
    status.setAbort(jqXHR);
}


loadDir = () => {
  rowCount=0;
  $('.statusbar').remove();

  $.ajax({
    url:"files",
    type:"GET",
    dataType:'json',
    cache : false
  }).done((data)=>{
    //console.log(data);
    createFileList(data);
  });
}

createFileList = (data) => {
  $("#filelist div").remove();
  for(n=0;n<data.length;n++){
    if(data[n].type=='image'){
      $("#filelist").append('<div class="image" data-name="'+data[n].name+'"><img src="data/'+data[n].name+'"><span>'+data[n].name+'</span><button>X</button><div><input type="number" name="time" value="'+data[n].time+'">秒<div></div>');

    }
    if(data[n].type=='video'){
      $("#filelist").append('<div class="video" data-name="'+data[n].name+'"><video src="data/'+data[n].name+'" controls></video><span>'+data[n].name+'</span><button>X</button></div>');

    }
  }
  $("#filelist").sortable({axis:'y'});
  $("#filelist button").on('click',(e)=>{
    $(e.currentTarget).parent('div').remove();
  })

}

let rowCount=0;
loadDir();


function createStatusbar(obj)
{
  rowCount++;
  var row="odd";
  if(rowCount %2 ==0) row ="even";
  this.statusbar = $("<div class='statusbar "+row+"'></div>");
  this.filename = $("<div class='filename'></div>").appendTo(this.statusbar);
  this.size = $("<div class='filesize'></div>").appendTo(this.statusbar);
  this.progressBar = $("<div class='progressBar'><div></div></div>").appendTo(this.statusbar);
  this.abort = $("<div class='abort'>Abort</div>").appendTo(this.statusbar);
  obj.after(this.statusbar);
  
  this.setFileNameSize = function(name,size)
  {
    var sizeStr="";
    var sizeKB = size/1024;
    if(parseInt(sizeKB) > 1024)
    {
      var sizeMB = sizeKB/1024;
      sizeStr = sizeMB.toFixed(2)+" MB";
    }
    else
    {
      sizeStr = sizeKB.toFixed(2)+" KB";
    }

    this.filename.html(name);
    this.size.html(sizeStr);
  }
  this.setProgress = function(progress)
  {       
    var progressBarWidth =progress*this.progressBar.width()/ 100;  
    this.progressBar.find('div').animate({ width: progressBarWidth }, 10).html(progress + "% ");
    if(parseInt(progress) >= 100)
    {
      this.abort.hide();
    }
  }
  this.setAbort = function(jqxhr)
  {
    var sb = this.statusbar;
    this.abort.click(function()
    {
      jqxhr.abort();
      sb.hide();
    });
  }
}
function handleFileUpload(files,obj)
{
  for (var i = 0; i < files.length; i++) 
  {
    var fd = new FormData();
    fd.append('file', files[i]);

    var status = new createStatusbar(obj); //Using this we can set progress.
    status.setFileNameSize(files[i].name,files[i].size);
    sendFileToServer(fd,status);
  }
}
$(document).ready(function()
{
  var obj = $("#dragandrophandler");
  obj.on('dragenter', function (e) 
  {
    e.stopPropagation();
    e.preventDefault();
    $(this).css('border', '2px solid #0B85A1');
  });
  obj.on('dragover', function (e) 
  {
    e.stopPropagation();
    e.preventDefault();
  });
  obj.on('drop', function (e) 
  {
    $(this).css('border', '2px dotted #0B85A1');
    e.preventDefault();
    var files = e.originalEvent.dataTransfer.files;

    //We need to send dropped files to Server
    handleFileUpload(files,obj);
  });
  $(document).on('dragenter', function (e) 
  {
    e.stopPropagation();
    e.preventDefault();
  });
  $(document).on('dragover', function (e) 
  {
    e.stopPropagation();
    e.preventDefault();
    obj.css('border', '2px dotted #0B85A1');
  });
  $(document).on('drop', function (e) 
  {
    e.stopPropagation();
    e.preventDefault();
  });


  $('#root button').on('click',()=>{
    //$('#filelist').sortable("destroy");
    let files = [];
    $('#filelist>div').each((index,ele)=>{
      //console.log(ele);
      let eleClass='';
      if( $(ele).hasClass('image')){
        eleClass = 'image';
      }
      if( $(ele).hasClass('video')){
        eleClass = 'video';
      }

      let eleTime=0;
      if($(ele).find('input').first()){
        eleTime = parseInt($(ele).find('input').first().val());
        if(isNaN(eleTime)){
          eleTime=5;
        }
      }

      files.push({
        name: $(ele).data('name'),
        type: eleClass,
        time: eleTime
      })

    });
    console.log(files);
    
    $.ajax({
      url:"save",
      data: JSON.stringify(files),
      contentType: 'application/json',
      type:"POST",
      cache : false
    }).done((data)=>{
      loadDir();
    });
    
  });

});