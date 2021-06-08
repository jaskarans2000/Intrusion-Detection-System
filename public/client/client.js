const webSocket = new WebSocket(ip)
let joinBtn=document.querySelector(".join");
let recordingBtn=document.querySelector(".recordbtn-container");
let timings = document.querySelector(".timing");
let galleryBtn=document.querySelector(".gallery");
let counter = 0;
let clearObj;
//to store the recording
let recording=[];
let isRecording=false;
let mediarecordingObjectForCurrStream;


webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    switch (data.type) {
        case "offer":
            peerConn.setRemoteDescription(data.offer)
            createAndSendAnswer()
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

function createAndSendAnswer () {
    peerConn.createAnswer((answer) => {
        peerConn.setLocalDescription(answer)
        sendData({
            type: "send_answer",
            answer: answer
        })
    }, error => {
        console.log(error)
    })
}

function sendData(data) {
    data.username = username
    webSocket.send(JSON.stringify(data))
}


let localStream
let peerConn
let username

function joinCall() {

    username = "IDS"

    

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
        //for recording
        mediarecordingObjectForCurrStream= new MediaRecorder(stream);

        //when stream is available on buffer add it to recording
        mediarecordingObjectForCurrStream.addEventListener("dataavailable",function(r){
            recording.push(r.data);
        });

        //when recording stopped
        mediarecordingObjectForCurrStream.addEventListener("stop",function(){
            // recording -> url convert 
            // type -> MIME type (extension)
            const blob = new Blob(recording, { type: 'video/mp4' });
            addMediaToGallery(blob, "video");
            recording = [];
        })

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

        peerConn.onaddstream = (e) => {
            document.getElementById("remote-video")
            .srcObject = e.stream
        }

        peerConn.onicecandidate = ((e) => {
            if (e.candidate == null)
                return
            
            sendData({
                type: "send_candidate",
                candidate: e.candidate
            })
        })

        sendData({
            type: "join_call"
        })

    }, (error) => {
        console.log(error)
    })
}



let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}

joinBtn.addEventListener("click",function(){
    recordingBtn.classList.remove("invisible");
    galleryBtn.classList.remove("invisible");
    joinBtn.classList.add("joinBtn-animation")
    joinBtn.style.display="none";
    joinCall();
})


//recording on/off
recordingBtn.addEventListener("click",function(e){
    if (mediarecordingObjectForCurrStream == undefined) {
        alert("First select the devices");
        return;
    }else if(isRecording){
        mediarecordingObjectForCurrStream.stop();
        stopTimer();
        recordingBtn.classList.remove("record-animation");
    }else{
        mediarecordingObjectForCurrStream.start();
        startTimer();
        recordingBtn.classList.add("record-animation");      
    }
    isRecording=!isRecording;
})

//timer
function startTimer() {
    timings.style.display = "block";
    function fn() {
        // hours
        let hours = Number.parseInt(counter / 3600);
        let RemSeconds = counter % 3600;
        let mins = Number.parseInt(RemSeconds / 60);
        let seconds = RemSeconds % 60;
        hours = hours < 10 ? `0${hours}` : hours;
        mins = mins < 10 ? `0${mins}` : `${mins}`;
        seconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
        timings.innerText = `${hours}:${mins}:${seconds}`
        counter++;
    }
    clearObj = setInterval(fn, 1000);
}
function stopTimer() {
    timings.style.display = "none";
    clearInterval(clearObj);
}

//gallery button
galleryBtn.addEventListener("click",function(){
    location.assign("gallery.html");
})