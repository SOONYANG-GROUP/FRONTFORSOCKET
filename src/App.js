import io from "socket.io-client";
import React, { useRef, useState, useEffect } from "react";
import logo from './logo.svg';
import './App.css';

let roomName = "";
let myStream = {};
let myPeerConnection = {};


const localServer = "https://webcamback.onrender.com";

const socket = io.connect(localServer);

function App() {
  const [ enterRoom, setEnterRoom ] = useState(false);
  const [ isMute, setIsMute ] = useState(false);
  const [ isCameraOn, setIsCameraOn ] = useState(true);
  const [ roomNameTerm, setRoomNameTerm ] = useState("");

  const peerVideoRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    socket.on("welcome", async () => {
      const offer = await myPeerConnection.createOffer();
      myPeerConnection.setLocalDescription(offer);
      console.log("sent the offer");
      socket.emit("offer", offer, roomName);
    });
    socket.on("offer", async (offer) => {
      console.log("received the offer")
      myPeerConnection.setRemoteDescription(offer);
      const answer = await myPeerConnection.createAnswer();
      myPeerConnection.setLocalDescription(answer);
      socket.emit("answer", answer, roomName);
      console.log("sent the answer");
    });
    socket.on("answer", (answer) => {
      console.log("received the answer")
      myPeerConnection.setRemoteDescription(answer);
    });
    socket.on("ice", ice => {
      console.log("received Candidate");
      myPeerConnection.addIceCandidate(ice);
    });
  }, []);

  const GetMedia = async () => {
    try
    {
      myStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      const video = videoRef.current;
      video.srcObject = myStream;
      video.play();
    }
    catch(e)
    {
      console.log(e);
    }
  }

  const onChangeIsMute = (e) => {
    videoRef.current.srcObject.getAudioTracks().forEach((track) => (
      track.enabled = !track.enabled
    ));
    setIsMute(!isMute);
  }

  const onChangeIsCameraOn = (e) => {
    videoRef.current.srcObject.getVideoTracks().forEach((track) => (
      track.enabled = !track.enabled
    ));
    setIsCameraOn(!isCameraOn);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    await InitCall();
    socket.emit("join_room", roomNameTerm);
    roomName = roomNameTerm;
    setRoomNameTerm(""); 
  }

  const InitCall = async () => {
    setEnterRoom(true);
    await GetMedia();
    MakeConnection();
  }

  const MakeConnection = () => {
    myPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
          ]
        }
      ]
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);

    myStream.getTracks().forEach((track) => (
      myPeerConnection.addTrack(track, myStream)
    ));
  }

  const onChangeRoomNameTerm = (e) => {
    setRoomNameTerm(e.target.value);
  }

  const handleIce = (data) => {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
  }

  const handleAddStream = (data) => {
    const video = peerVideoRef.current;
    video.srcObject = data.stream;
    video.play();
  }

  if(enterRoom)
  {
    return(
      <div>
        <h1>{roomName}</h1>
        <br style={{border: '1px solid black'}} />
        <video ref={videoRef} playsInline>
        </video>
        <video ref={peerVideoRef} playsInline>
        </video>
        <button onClick={onChangeIsMute}>
          {isMute ? ("Mute OFF") : ("Mute ON")}
        </button>
        <button onClick={onChangeIsCameraOn}>
          {isCameraOn ? ("Camera OFF") : ("Camera On")}
        </button>
      </div>
    )
  }
  else
  {
    return(<Home roomNameTerm={roomNameTerm} onChangeRoomNameTerm={onChangeRoomNameTerm} onSubmit={onSubmit} />)
  }
}

const Home = ({
  roomNameTerm,
  onChangeRoomNameTerm,
  onSubmit
}) => {
  return(
    <div className="App">
      <form onSubmit={onSubmit}>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <div>
            <input 
              name="roomNameTerm"
              value={roomNameTerm}
              onChange={onChangeRoomNameTerm}
              className="form-control"
              placeholder="방 번호 입력하기"
            />
          </div>
          <div className="mt-3">
            <button className="btn btn-primary">
              Enter Room
            </button>
          </div>
        </header>
      </form>
    </div>
  )
}



export default App;
