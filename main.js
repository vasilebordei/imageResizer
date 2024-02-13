const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
process.env.NODE_ENV = "production";
const os = require("os");
const fs = require("fs");
const isMac = process.platform === "darwin";
const isDev = process.env.NODE_ENV !== "production";
const resizeImg = require("resize-img");
const path = require("node:path");

let win;

// create main window
function createMainWindow() {
  win = new BrowserWindow({
    title: "ImageModifier",
    width: isDev ? 1000 : 500,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    win.webContents.openDevTools();
  }

  win.loadFile(path.join(__dirname, "./renderer/index.html"));
}

//create about window
function createAboutWindow() {
  const aboutWin = new BrowserWindow({
    title: "About ImageModifier",
    width: 300,
    height: 300,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  aboutWin.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// app is ready
app.whenReady().then(() => {
  createMainWindow();

  //implement menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  //remove mainWindow from memory
  win.on("closed", () => (win = null));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});
//Menu template

const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "Quit",
              click: () => app.quit(),
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

//Respond to ipcRenderer
ipcMain.on("image:resize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageresizer");
  resizeImage(options);
});

//resize the image

async function resizeImage({ imgPath, width, height, dest }) {
  try {
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height,
    });

    //create filename
    const filename = path.basename(imgPath);

    //create destination folder if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    //write file to the destination
    fs.writeFileSync(path.join(dest, filename), newPath);

    //send success message to renderer
    win.webContents.send("image:done");
    //open destination folder
    shell.openPath(dest);
  } catch (error) {
    console.log(error);
  }
}

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
