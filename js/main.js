import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3"

const demosSection = document.getElementById("demos")
let gestureRecognizer
let runningMode = "IMAGE"
let enableWebcamButton
let webcamRunning = false
const videoHeight = "1440px"//"360px"
const videoWidth = "1920px"//"480px"

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  )
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: runningMode
  })
  demosSection.classList.remove("invisible")
}
createGestureRecognizer()

/********************************************************************
// Demo: Continuously grab image from webcam stream and detect it.
********************************************************************/

const video = document.getElementById("webcam")
const canvasElement = document.getElementById("output_canvas")
const canvasCtx = canvasElement.getContext("2d")
//const gestureOutput = document.getElementById("gesture_output")

// Check if webcam access is supported.
function hasGetUserMedia()
{
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia())
  {
  enableWebcamButton = document.getElementById("webcamButton")
  enableWebcamButton.addEventListener("click", enableCam)
}
else
{
  console.warn("getUserMedia() is not supported by your browser")
}

function clientConsoleLog(log_content)
{
    console.log(log_content);
}

function enter_fullscreen()
{
    clientConsoleLog("Entering fullscreen");
    
    /* Get the documentElement (<html>) to display the page in fullscreen */
    var elem = document.documentElement;
    
    /* When the openFullscreen() function is executed, open the video in fullscreen.
    Note that we must include prefixes for different browsers, as they don't support the requestFullscreen method yet */
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

// Enable the live webcam view and start detection.
function enableCam(event)
{
  if (!gestureRecognizer)
    {
    alert("Please wait for gestureRecognizer to load")
    return
  }

  if (webcamRunning === true)
  {
    webcamRunning = false
    enableWebcamButton.innerText = "ENABLE PREDICTIONS"
  }
  else
  {
    webcamRunning = true
    enableWebcamButton.innerText = "DISABLE PREDICTIONS"
  }

  // getUsermedia parameters.
  const constraints = {
    video: true
  }

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream
    video.addEventListener("loadeddata", predictWebcam)
  })

  // enter_fullscreen();
}

let lastVideoTime = -1
let results = undefined

async function predictWebcam()
{
  const webcamElement = document.getElementById("webcam")

  // Now let's start detecting the stream.
  if (runningMode === "IMAGE")
  {
    runningMode = "VIDEO"
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" })
  }
  
  let nowInMs = Date.now()
  
  if (video.currentTime !== lastVideoTime)
  {
    lastVideoTime = video.currentTime
    results = gestureRecognizer.recognizeForVideo(video, nowInMs)
  }

  canvasCtx.save()
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
  const drawingUtils = new DrawingUtils(canvasCtx)

  canvasElement.style.height = videoHeight
  webcamElement.style.height = videoHeight
  canvasElement.style.width = videoWidth
  webcamElement.style.width = videoWidth

  if (results.landmarks)
  {
    for (const landmarks of results.landmarks)
    {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5
        }
      )
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2
      })
    }
  }

  canvasCtx.restore()

  // if (results.gestures.length > 0)
  // {
  //   gestureOutput.style.display = "block"
  //   gestureOutput.style.width = videoWidth
  //   const categoryName = results.gestures[0][0].categoryName
  //   const categoryScore = parseFloat(
  //     results.gestures[0][0].score * 100
  //   ).toFixed(2)
  //   const handedness = results.handednesses[0][0].displayName
  //   gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`
  // }
  // else
  // {
  //   gestureOutput.style.display = "none"
  // }

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true)
  {
    window.requestAnimationFrame(predictWebcam)
  }
}
