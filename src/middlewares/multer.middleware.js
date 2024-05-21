import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)   
      //there might be conflict in the future when multiple users upload file at the same time with same name then the file can get overwritten
    }
  })
    
  export const upload = multer({ storage: storage })