const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('./auth');
const app = express();
const path = require('path');
const axios = require('axios');
const PORT = process.env.PORT || 3000
const fs = require('fs');
const getDominantColorFromUrl = require('./utils/getColor');
const { v4: uuidv4 } = require('uuid');
const DATA_PATH = path.join(__dirname, 'data', 'images.json');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'public/uploads') });


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware para procesar peticiones POST que vengan de un formulario
app.use(session({ secret: 'cats',  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // debe ser true si usas HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware para que la variable 'user' esté disponible en todas las vistas EJS
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

//Función para verificar si el usuario está loggeado
function isLoggedIn(req, res, next){
  req.user ? next() : res.render('login-required.ejs');
}

// Función para leer las imágenes desde el archivo JSON
function readImages() {
  try {
    const data = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

// Función para guardar una nueva imagen en el JSON
function saveImages(images) {

  fs.writeFileSync(DATA_PATH, JSON.stringify(images, null, 2), 'utf8');
}
//Ruta de autentificacion
app.get("/", (req, res) => {
   const images = readImages();
  const { search } = req.query;

  let filtered = images;

  if (search) {
    const lowerSearch = search.toLowerCase();
    filtered = filtered.filter(img => img.title.toLowerCase().includes(lowerSearch)||
    img.category.toLowerCase().includes(lowerSearch));
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.render('home', {
    images: filtered,
    query: req.query
  });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/google/callback',
  passport.authenticate('google', {
    successRedirect: '/home',
    failureRedirect: 'auth/failure',
  })
);
app.get('/auth/failure', (req, res) => {
  res.send('Error durante la auntentificación...');
});

// Ruta a home
app.get("/home", (req, res) => {
   const images = readImages();
  const { search } = req.query;

  let filtered = images;

  if (search) {
    const lowerSearch = search.toLowerCase();
    filtered = filtered.filter(img => img.title.toLowerCase().includes(lowerSearch)||
    img.category.toLowerCase().includes(lowerSearch));
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.render('home', {
    images: filtered,
    query: req.query
  });
});

// Ruta para mostrar el formulario de nueva imagen
app.get("/new-image", isLoggedIn, (req, res) => {
   res.render("add-img.ejs", {
    message: undefined // no tengo nada que informar al usuario por el momento
  });
});

// Ruta para manejar el envío del formulario
app.post("/new-image", upload.single('image'), async (req, res) => {
  const { title, url, date, category } = req.body;
  const images = readImages();
  const errors = [];
  const id = uuidv4();

  // Validación de título
  const titlePattern = /^[a-zA-Z0-9 _áéíóúÁÉÍÓÚñÑüÜ]{1,30}$/;
  if (!titlePattern.test(title)) {
    errors.push('Título inválido.');
  }

  let imageUrl = url?.trim();
  let finalPath = '';
  let color = '';

  // Validar que se haya proporcionado URL o archivo
  if (!imageUrl && !req.file) {
    errors.push("Por favor, introduce una URL o sube una imagen.");
  }

  // Procesar si es URL
  if (imageUrl) {
    try {
      new URL(imageUrl);
    } catch (e) {
      errors.push('URL inválida.');
    }

    const alreadyExists = images.some(img => img.url === imageUrl);
    if (alreadyExists) {
      errors.push(`La imagen con URL: ${imageUrl} ya existe en la base de datos.`);
    }

    // Descargar imagen y guardar localmente
    if (errors.length === 0) {
      try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const localFileName = `${id}${ext}`;
        finalPath = path.join(__dirname, 'public', 'uploads', localFileName);
        fs.writeFileSync(finalPath, response.data);
        imageUrl = `/uploads/${localFileName}`;
        console.log(`Imagen desde URL guardada en ${finalPath}`);
      } catch (err) {
        console.error('Error al descargar imagen desde URL:', err.message);
        errors.push('No se pudo descargar la imagen desde la URL proporcionada.');
      }
    }
  }

  // Procesar si es archivo subido
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const finalFileName = `${id}${ext}`;
    const newPath = path.join(__dirname, 'public', 'uploads', finalFileName);

    fs.renameSync(req.file.path, newPath);
    imageUrl = `/uploads/${finalFileName}`;
    finalPath = newPath;
    console.log(`Imagen subida guardada en ${newPath}`);
  }

  if (errors.length > 0) {
    return res.render('add-img.ejs', { message: errors.join(' ') });
  }

  // Obtener color dominante
  color = await getDominantColorFromUrl(`http://localhost:3000${imageUrl}`);

  // Guardar info en JSON
  images.push({ id, title, url: imageUrl, date, color, category });
  saveImages(images);

  console.log("Imagen añadida:", { title, imageUrl, date, color, category });
  res.render("add-img.ejs", {
    message: "La imagen se ha añadido correctamente"
  });
});
// Ruta para mostrar todas las imágenes desde el archivo JSON
app.get('/show-images', isLoggedIn, (req, res) => {
  const images = readImages();
  const { search } = req.query;

  let filtered = images;

  if (search) {
    const lowerSearch = search.toLowerCase();
    filtered = filtered.filter(img => img.title.toLowerCase().includes(lowerSearch)||
    img.category.toLowerCase().includes(lowerSearch));
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.render('show-img', {
    images: filtered,
    query: req.query
  });
});

  app.post('/delete-image', isLoggedIn, (req, res) => {
    const { id } = req.body;
    let images = readImages();

    // Guardar copia de seguridad antes de eliminar
    const deletedImage = images.find(img => img.id === id);
    if (deletedImage) {
      const backupPath = path.join(__dirname, 'data', 'backup.json');
      const backup = fs.existsSync(backupPath)
        ? JSON.parse(fs.readFileSync(backupPath, 'utf8'))
        : [];

      backup.push(deletedImage);
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');
      console.log("Backup realizado correctamente");
    }
  // Eliminar archivo local si es necesario
  if (deletedImage.url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, 'public', deletedImage.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Archivo físico eliminado:", filePath);
    }
  }
    // Eliminar imagen
    images = images.filter(img => img.id !=id);
    saveImages(images);
  console.log("Imagen eleminada correctamente");
    res.redirect('/show-images');
  });

//Ruta para logout

app.get('/logout', (req, res )=> {
  const displayName = req.user ? req.user.displayName : 'usuario';
  req.logout(() => {
    req.session.destroy();
    res.render('goodbye', { name: displayName });
  });
});

// Middleware para manejar errores 404
app.use((req, res) => {
  res.status(404).render('404', {
    url: req.originalUrl
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

