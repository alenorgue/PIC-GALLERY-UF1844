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
const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
    const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}`;
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DATABASE
    });
    console.log('Conexión a MongoDB establecida');
  } catch (error) {
    console.error('Error de conexión a MongoDB:', error);
    console.error('Variables de entorno:', {
      user: process.env.MONGODB_USER ? 'definido' : 'indefinido',
      password: process.env.MONGODB_PASSWORD ? 'definido' : 'indefinido',
      cluster: process.env.MONGODB_CLUSTER ? 'definido' : 'indefinido',
      database: process.env.MONGODB_DATABASE ? 'definido' : 'indefinido'
    });
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

connectDB();

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


// Definición del esquema y modelo de Mongoose para las imágenes
 const imageSchema = new mongoose.Schema({
        url: { type: String, required: true },
        title: {
            type: String,
            required: true,
            minlength: 1,
            maxlength: 30,
            match: /^[a-zA-Z0-9 _áéíóúÁÉÍÓÚñÑüÜ]+$/ // Permite letras, números, espacios y acentos
        },
        color: { type: String },
        date: { type: Date, required: true },
        category: {
            type: String,
            required: true,
            enum: ['Paisajes', 'Animales', 'Coches', 'artisticos', 'anime', 'cine', 'otros']
        }
    });

    const Image = mongoose.model('Images', imageSchema);

// Middleware para que la variable 'user' esté disponible en todas las vistas EJS
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

//Función para verificar si el usuario está loggeado
function isLoggedIn(req, res, next){
  req.user ? next() : res.render('login-required.ejs');
}



app.get("/", async (req, res) => {
  try {
    let images = await Image.find({});
    const { search } = req.query;

    if (search) {
      const lowerSearch = search.toLowerCase();
      images = images.filter(img =>
        img.title.toLowerCase().includes(lowerSearch) ||
        img.category.toLowerCase().includes(lowerSearch)
      );
    }

    images.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.render('home', {
      images,
      query: req.query
    });
  } catch (err) {
    console.error('Error al obtener imágenes:', err);
    res.status(500).send('Error al obtener imágenes');
  }
});

app.get('/google/callback',
  passport.authenticate('google', {
    successRedirect: '/show-images',
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
app.post("/new-image", async (req, res) => {
  // Verificar si el usuario está logueado
  if (!req.user) {
    return res.render('login-required.ejs');
  }

  const errors = [];
  const { title, url, date, category } = req.body;

  // Validación de título
  const titlePattern = /^[a-zA-Z0-9 _áéíóúÁÉÍÓÚñÑüÜ]{1,30}$/;
  if (!titlePattern.test(title)) {
    errors.push('Título inválido.');
  }

  let imageUrl = url?.trim();
  let finalPath = '';

  // Validar que se haya proporcionado URL
  if (!imageUrl) {
    errors.push("Por favor, introduce una URL de imagen.");
  }

  // Procesar URL
  if (imageUrl) {
    try {
      new URL(imageUrl);
    } catch (e) {
      errors.push('URL inválida.');
    }

    // Verificar si la imagen ya existe en MongoDB
    const existingImage = await Image.findOne({ url: imageUrl });
    if (existingImage) {
      errors.push(`La imagen con URL: ${imageUrl} ya existe en la base de datos.`);
    }

    // Descargar imagen y guardar localmente
    if (errors.length === 0) {
      try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const localFileName = `${uuidv4()}${ext}`;
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

  if (errors.length > 0) {
    return res.render('add-img.ejs', { message: errors.join(' ') });
  }

  try {
    // Obtener color dominante usando la URL local
    const fullUrl = `http://localhost:${PORT}${imageUrl}`;
    const color = await getDominantColorFromUrl(fullUrl);

    // Crear y guardar la nueva imagen en MongoDB
    const newImage = new Image({
      title,
      url: imageUrl,
      date: new Date(date),
      category,
      color
    });

    await newImage.save();
    console.log("Imagen añadida:", { title, url: imageUrl, date, color, category });
    res.render("add-img.ejs", {
      message: "La imagen se ha añadido correctamente"
    });
  } catch (error) {
    console.error('Error al guardar la imagen:', error);
    res.render("add-img.ejs", {
      message: "Error al guardar la imagen: " + error.message
    });
  }
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

  app.post('/delete-image', isLoggedIn, async (req, res) => {
    try {
      const { id } = req.body;
      
      // Encontrar la imagen en MongoDB
      const deletedImage = await Image.findById(id);
      
      if (!deletedImage) {
        console.log("Imagen no encontrada");
        return res.redirect('/show-images');
      }

      // Eliminar archivo local si existe
      if (deletedImage.url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, 'public', deletedImage.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Archivo físico eliminado:", filePath);
        }
      }

      // Eliminar documento de MongoDB
      await Image.findByIdAndDelete(id);
      console.log("Imagen eliminada correctamente");
      res.redirect('/show-images');
    } catch (error) {
      console.error("Error al eliminar la imagen:", error);
      res.status(500).send("Error al eliminar la imagen");
    }
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
