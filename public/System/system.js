const webSocket = new WebSocket(ip)
let powerBtn=document.querySelector(".powerBtn");
let video=document.getElementById("local-video");
const liveView = document.querySelector('.liveView');
// Store the resulting model in the global scope of our app.
var model = undefined;
var mailsent=false;
var children = [];

webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

let username
function sendUsername() {

    username = "IDS"
    sendData({
        type: "store_user"
    })
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}


let localStream
let peerConn
function startCall() {
    

    navigator.getUserMedia({
        video: {
            frameRate: 24,
            width: {
                min: 480, ideal: 720, max: 1280
            },
            aspectRatio: 1.33333
        },
    }, (stream) => {
        localStream = stream
        video.srcObject = localStream
        video.addEventListener('loadeddata', predictWebcam);

        let configuration = {
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302", 
                    "stun:stun1.l.google.com:19302", 
                    "stun:stun2.l.google.com:19302"]
                }
            ]
        }

        peerConn = new RTCPeerConnection(configuration)
        peerConn.addStream(localStream)

        // peerConn.onaddstream = (e) => {
        //     document.getElementById("remote-video")
        //     .srcObject = e.stream
        // }

        peerConn.onicecandidate = ((e) => {
            if (e.candidate == null)
                return
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        })

        createAndSendOffer()
    }, (error) => {
        console.log(error)
    })
}

function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })

        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error)
    })
}



// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment 
// to get everything needed to run.
// Note: cocoSsd is an external object loaded from our index.html
// script tag import so ignore any warning in Glitch.
cocoSsd.load().then(function (loadedModel) {
    model = loadedModel;
    //make loader invisible
    document.querySelector(".loader").classList.add("invisible");
    // Show power button now model is ready to use.
    powerBtn.classList.remove('invisible');
  });


  // Check if webcam access is supported.
function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia);
  }

   // If webcam supported, add event listener to button for when user
  // wants to activate it to call enableCam function which we will 
  // define in the next step.
  if (getUserMediaSupported()) {
    powerBtn.addEventListener("click",function(){
        powerBtn.classList.add("powerBtn-animation");
        powerBtn.style.display="none";
        sendUsername();
        startCall();
    });
  } else {
    console.warn('getUserMedia() is not supported by your browser');
  }


  //to make predictions
  function predictWebcam() {
    // Now let's start classifying a frame in the stream.
    model.detect(video).then(function (predictions) {
      // Remove any highlighting we did previous frame.
      for (let i = 0; i < children.length; i++) {
        liveView.removeChild(children[i]);
      }
      children.splice(0);
      
      // Now lets loop through predictions and draw them to the live view if
      // they have a high confidence score.
      for (let n = 0; n < predictions.length; n++) {
        // If we are over 66% sure we are sure we classified it right, draw it!
        if (predictions[n].score > 0.66 && predictions[n].class=="person") {
          const p = document.createElement('p');
          p.innerText="INTRUDER";
          // p.innerText = predictions[n].class  + ' - with ' 
          //     + Math.round(parseFloat(predictions[n].score) * 100) 
          //     + '% confidence.';
          p.style = 'margin-left: ' + (predictions[n].bbox[0]+300) + 'px; margin-top: '
              + (predictions[n].bbox[1] ) + 'px; width: ' 
              + (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';
  
          const highlighter = document.createElement('div');
          highlighter.setAttribute('class', 'highlighter');
          highlighter.style = 'left: ' + (predictions[n].bbox[0]+300) + 'px; top: '
              + predictions[n].bbox[1] + 'px; width: ' 
              + predictions[n].bbox[2] + 'px; height: '
              + (predictions[n].bbox[3]-20) + 'px;';
  
          liveView.appendChild(highlighter);
          liveView.appendChild(p);
          children.push(highlighter);
          children.push(p);
          // let canvas = document.createElement("canvas");
          // canvas.height = video.videoHeight;
          // canvas.width = video.videoWidth;
          // let tool = canvas.getContext("2d");
          // tool.drawImage(video, 0, 0);
          // let url = canvas.toDataURL();
          if(!mailsent){
            Email.send({
              SecureToken: secureToken,
              To : To,
              From : From,
              Subject : "IDS ALERT",
              Body : ` Hello Jaskaran Singh,
              The IDS system has detected an intruder in your home. Please check the footage to know more and take further actions `,
              }).then(
                message => {
                  if(message=="OK"){
                      console.log("mail sent!")
                    // alert("mail sent successfully")
                  }else{
                    alert(message);
                  }
                }
              );
              mailsent=!mailsent;
          }
        }
      }
      
      // Call this function again to keep predicting when the browser is ready.
      window.requestAnimationFrame(predictWebcam);
    });
  }