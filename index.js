const express = require("express");
const app = express()
const PORT = process.env.PORT || 3000;
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const exphbs = require("express-handlebars");

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts/",
    partialsDir: __dirname + "/views/partials/",
    helpers: {
      range: function(start, end) {
        let result = [];
        for (let i = start; i <= end; i++) {
          result.push(i);
        }
        return result;
      },
      add: function(a, b) {
        return a + b;
      },
      subtract: function(a, b) {
        return a - b;
      },
      gt: function(a, b) {
        return a > b;
      },
      lt: function(a, b) {
        return a < b;
      }
    }
  })
);

app.set("view engine", ".hbs");

// middleware:
app.use(express.urlencoded({ extended: true })); // handle normal forms -> url encoded
app.use(express.json()); // Handle raw json data
app.use(express.static("uploads"));

app.get("/", (req, res) => {
  // res.sendFile(__dirname + "/views/index.html");
  res.render("home", { title: "Home Page" });
});

app
  .route("/upload")
  .get((req, res) => {
    // res.sendFile(__dirname + "/views/upload.html");
    res.render("upload", { title: "Upload Single File" });
  })
  .post(upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    res.send(`File uploaded successfully: ${req.file.path}`);
  });

app
  .route("/upload-multiple")
  .get((req, res) => {
    // res.sendFile(path.join(__dirname, "views", "upload-multiple.html"));
    res.render("upload-multiple", { title: "Multiple Image Uploader" });
  })
  .post(upload.array("files", 100), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    const filePaths = req.files.map((file) => file.path);
    res
      .status(200)
      .send(`Files uploaded successfully: ${filePaths.join(", ")}`);
  });

  // app.get("/fetch-single", (req, res) => {
  //   let upload_dir = path.join(__dirname, 'uploads');
  
  //   // NOTE: This reads the directory, not the file, so think about how you can use this for the assignment
  //   let uploads = fs.readdirSync(upload_dir);
  //   console.log(uploads);
  //   // Add error handling
  //   if (uploads.length == 0) {
  //     return res.status(503).send({
  //       message: "No images",
  //     });
  //   }
  //   let max = uploads.length - 1;
  //   let min = 0;
  
  //   let index = Math.round(Math.random() * (max - min) + min);
  //   let randomImage = uploads[index];
  
  //   res.sendFile(path.join(upload_dir, randomImage));
  // });
  
  // we dont need the route anymore, since we can render the page beforehand
  
  function fetchRandomImage() {
    let uploadDir = path.join(__dirname, 'uploads');
    let uploads = fs.readdirSync(uploadDir);
    if (uploads.length === 0) {
      throw new Error("No images found in the upload directory");
    }
  
    let max = uploads.length - 1;
    let min = 0;
    let index = Math.floor(Math.random() * (max - min + 1) + min); // Use Math.floor for random integer
    let randomImage = uploads[index];
  
    return path.join('uploads', randomImage); // Return relative path for rendering
  }
  
  // Route to render a single image
  app.get('/single', (req, res) => {
    try {
      let randomImage = fetchRandomImage();
      console.log(randomImage);
      res.render('single', { title: 'Single', file: randomImage });
    } catch (error) {
      console.error("Error fetching random image:", error.message);
      res.status(503).send({
        message: "No images available",
        error: error.message,
      });
    }
  });
/*
Need to be implemented:
You can rename these routes as you need
*/

/*multiple: handle a webpage to grab multiple random images from the server
/fetch-multiple - This route will grab the multiple photos for the webpage multiple
*/
// Function to fetch multiple random images
function fetchMultipleRandomImages(numberOfImages) {
  let uploadDir = path.join(__dirname, 'uploads');
  let uploads = fs.readdirSync(uploadDir);
  if (uploads.length === 0) {
    throw new Error("No images found in the upload directory");
  }

  let randomImages = [];
  for (let i = 0; i < numberOfImages; i++) {
    let index = Math.floor(Math.random() * uploads.length);
    randomImages.push(path.join('uploads', uploads[index]));
  }
  
  return randomImages;
}

// Route to render multiple random images
app.get('/fetch-multiple', (req, res) => {
  try {
    const numberOfImages = 5;
    let randomImages = fetchMultipleRandomImages(numberOfImages);
    res.render('fetch-multiple', {
      title: 'Multiple Random Images',
      images: randomImages
    });
    console.log(randomImages)
  } catch (error) {
    console.error("Error fetching random images:", error.message);
    res.status(503).send({
      message: "No images available",
      error: error.message,
    });
  }
});
/*gallery - showcases all images from the server
/fetch-all - Grab all items from the upload folder
*/
function fetchAllImages() {
  let uploadDir = path.join(__dirname, 'uploads');
  let uploads = fs.readdirSync(uploadDir);
  if (uploads.length === 0) {
    throw new Error("No images found in the upload directory");
  }

  return uploads.map(image => path.join('uploads', image));
}

// Route to render the gallery
app.get('/gallery', (req, res) => {
  try {
    let images = fetchAllImages();
    res.render('gallery', {
      title: 'Gallery',
      images: images
    });
    console.log(images);
  } catch (error) {
    console.error("Error fetching images:", error.message);
    res.status(503).send({
      message: "No images available",
      error: error.message,
    });
  }
});

/*gallery-pagination - showcase all images from the server, using pagination
/fetch-all-pagination/pages/:index
*/
// Function to get all files from a directory
const pagination = require('./middleware/pagination');

app.get('/gallery-pagination', pagination, (req, res) => {
  res.render('gallery-pagination', {
    files: req.paginatedFiles,
    currentPage: req.currentPage,
    totalPages: req.totalPages
  });
});
// catch all other requests
app.use((req, res) => {
  res.status(404).send("Route not found");
});
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`); 
});