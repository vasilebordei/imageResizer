// Select the form element from the DOM
const form = document.querySelector("#img-form");

// Select the img element from the DOM
const img = document.querySelector("#img");

// Select the output path element from the DOM
const outputPath = document.querySelector("#output-path");

// Select the filename element from the DOM
const filename = document.querySelector("#filename");

// Select the height input element from the DOM
const heightInput = document.querySelector("#height");

// Select the width input element from the DOM
const widthInput = document.querySelector("#width");

// Function to load an image
// It takes an event as a parameter
function loadImage(e) {
  // Get the first file from the event target's files property
  const file = e.target.files[0];

  // Check if the file is an image
  // If it's not an image, alert the user and exit the function
  if (!isFileImage(file)) {
    alertError("File must be an image");
    return;
  }

  //get original dimensions
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function () {
    widthInput.value = this.width;
    heightInput.value = this.height;
  };

  form.style.display = "block";
  filename.innerText = file.name;
  outputPath.innerText = path.join(os.homedir(), "imageresizer");
}

// Send image data to main
function sendImage(e) {
  e.preventDefault();

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = img.files[0].path;

  if (!img.files[0]) {
    alertError("Please upload an image ");
    return;
  }

  if (width === "" || height === "") {
    alertError("Please fill in a height and width");
    return;
  }

  // send to main using ipcRenderer
  ipcRenderer.send("image:resize", {
    imgPath,
    width,
    height,
  });
}

//Catch the image:done event
ipcRenderer.on("image:done", () => {
  alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`);
});

// Function to verify if a file is an image
function isFileImage(file) {
  const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];
  return file && acceptedImageTypes.includes(file["type"]);
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "red",
      color: "white",
      textAlign: "center",
    },
  });
}

function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "green",
      color: "white",
      textAlign: "center",
    },
  });
}

img.addEventListener("change", loadImage);

form.addEventListener("submit", sendImage);
