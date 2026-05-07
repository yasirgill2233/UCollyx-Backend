// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = 'uploads/'; // Default folder

//     // 1. Check karein ke file ka fieldname kya ha
//     if (file.fieldname === 'avatar') {
//       folder = 'uploads/avatars/';
//     } else if (file.fieldname === 'logo') {
//       folder = 'uploads/logos/';
//     }

//     // 2. Agar folder manually nahi bana hua, to node usay khud create kar le
//     if (!fs.existsSync(folder)) {
//       fs.mkdirSync(folder, { recursive: true });
//     }

//     cb(null, folder);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     // Filename prefix bhi dynamic rakh saktay hain
//     const prefix = file.fieldname === 'avatar' ? 'avatar' : 'logo';
//     cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// // File filter (Optional: Sirf images allow karne k liye)
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (extname && mimetype) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPEG, JPG, and PNG files are allowed!'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit
//   fileFilter: fileFilter
// });

// module.exports = upload;




const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';

    if (file.fieldname === 'avatar') {
      folder = 'uploads/avatars/';
    } else if (file.fieldname === 'logo') {
      folder = 'uploads/logos/';
    } else if (file.fieldname === 'attachments') {
      // Chat attachments ke liye alag folder
      folder = 'uploads/attachments/';
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Fieldname ke hisaab se prefix set karein
    const prefix = file.fieldname; 
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Chat ke liye hum images ke ilawa documents bhi allow karenge
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedDocs = /pdf|doc|docx|zip|txt/;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = allowedImages.test(ext);
  const isDoc = allowedDocs.test(ext);

  if (isImage || isDoc) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Chat ke liye limit barha kar 10MB kar di hai
  fileFilter: fileFilter
});

module.exports = upload;