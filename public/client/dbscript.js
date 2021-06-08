let request = indexedDB.open("Camera", 1);
let db;

request.onsuccess = function (e) {
  db = request.result;
};

request.onerror = function (e) {
  console.log("error");
};

request.onupgradeneeded = function (e) {
  db = request.result;
  db.createObjectStore("gallery", { keyPath: "mId" });
};

//add media to gallery

function addMediaToGallery(data, type) {
    let tx = db.transaction("gallery", "readwrite");
    let gallery = tx.objectStore("gallery");
    gallery.add({ mId: Date.now(), type, media: data });
  }


  //view stored media
  function viewMedia() {
    let gbody = document.querySelector(".gallery");
    let tx = db.transaction("gallery", "readonly");
    let gallery = tx.objectStore("gallery");
    let req = gallery.openCursor();
    req.onsuccess = function (e) {
      let cursor = req.result;
      if (cursor) {
        
          let vidContainer = document.createElement("div");
          vidContainer.setAttribute("data-mId", cursor.value.mId);
          vidContainer.classList.add("gallery-vid-container");
          let video = document.createElement("video");
          vidContainer.appendChild(video);
  
          let deleteBtn = document.createElement("button");
          deleteBtn.classList.add("gallery-delete-button");
          deleteBtn.innerText = "Delete";
          // delete
          deleteBtn.addEventListener("click", deleteBtnHandler);
          let downloadBtn = document.createElement("button");
          downloadBtn.classList.add("gallery-download-button");
          downloadBtn.innerText = "Download";
          // download
          downloadBtn.addEventListener("click", donwloadBtnHandler);
          vidContainer.appendChild(deleteBtn);
          vidContainer.appendChild(downloadBtn);
  
          video.autoplay = true;
          video.controls = true;
          video.loop = true;
          video.src = window.URL.createObjectURL(cursor.value.media);
          gbody.appendChild(vidContainer);
         
        cursor.continue();
      }
    };
  }

  //delete item from gallery
  function deleteMediaFromGallery(mId) {
    let tx = db.transaction("gallery", "readwrite");
    let gallery = tx.objectStore("gallery");
    console.log(mId);
    //Typecasting to a number is imp because we have stored Date.now() which gives us a number
    gallery.delete(Number(mId));
  }
  
  // delete item from ui
  function deleteBtnHandler(e) {
    let mId = e.currentTarget.parentNode.getAttribute("data-mId");
    deleteMediaFromGallery(mId);
    e.currentTarget.parentNode.remove();
  }
  
  // download video 
  function donwloadBtnHandler(e) {
    let a = document.createElement("a");
    a.href = e.currentTarget.parentNode.children[0].src;
     a.download = "video.mp4";
    a.click()
    a.remove()
  }