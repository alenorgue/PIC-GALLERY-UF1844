const express = require('express');
const session = require('express-session');
const passport = require('passport');
require('./auth');
const app = express();
const path = require('path');
const PORT = 3000;
const fs = require('fs');
const getDominantColorFromUrl = require('./utils/getColor');
const { v4: uuidv4 } = require('uuid');
const DATA_PATH = path.join(__dirname, 'data', 'images.json');



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware para procesar peticiones POST que vengan de un formulario
app.use(session({ secret: 'cats'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
 res.send("<a href='/auth/google'>Autentificación con Google</a>")
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
app.post("/new-image", async (req, res) => {
  const { title, url, date, category } = req.body;
  const images = readImages();
  const errors = [];
  const id = uuidv4();
  
 const titlePattern = /^[a-zA-Z0-9 _áéíóúÁÉÍÓÚñÑüÜ]{1,30}$/;
  if (!titlePattern.test(title)) {
    errors.push('Título inválido.');
  }
try {
    new URL(url);
  } catch (e) {
    errors.push('URL inválida.');
  }

  const alreadyExists = images.some(img => img.url === url);
  if (alreadyExists) {
    errors.push(`La imagen con URL: ${url} ya existe en la base de datos.`);
  }
 if (errors.length > 0) {
    return res.render('add-img', { message: errors.join(' ') });
  }
  if (!title || !url) {
 res.render("add-img.ejs", {
    message: "Faltan campo obligatorios"
 
});}

//Obtener color
const color = await getDominantColorFromUrl(url);
console.log(`Color obtenido para ${url}: ${color}`);

  // Guardar en el archivo JSON
images.push({ id, title, url, date, color, category });
  saveImages(images);

  console.log("Imagen añadida:", { title, url , date, color, category });
res.render("add-img.ejs", {
    message: "La imagen se ha añadido correctamente"
 
})});

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

app.post('/delete-image', (req, res) => {
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

  // Eliminar imagen
  images = images.filter(img => img.id !=id);
  saveImages(images);
 console.log("Imagen eleminada correctamente");
  res.redirect('/show-images');
});
//Ruta para logout

app.get('/logout', (req, res )=> {
  req.logout();
  req.session.destroy();
  res.send(`Hasta la próxima visita ${req.user.displayName}`)
})

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

