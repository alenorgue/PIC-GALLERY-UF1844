# PIC GALLERY-UF1844: : Development of Web Applications in the Server-Side Environment

## English
This image gallery app, serving as the evaluated project for the UF1844 module, is part of the Ironhack Bootcamp and the IFCD0210 Professional Certificate.

Use the app [here](https://pic-gallery-uf1844.onrender.com)*       
_<sub>*It may take around 30 seconds to load due to free hosting limitations</sub>_

### Features
- User authentication with Google (OAuth via Passport.js)
- Add images by URL or file upload
- Automatic dominant color extraction for images

### Features
- User authentication with Google (OAuth via Passport.js)
- Add images by URL or file upload
- Automatic dominant color extraction for images
- Image gallery with search and filter by title and date
- Delete images (with backup and file removal)
- Responsive, modern UI with EJS and CSS
- 404 error page with navigation

### Tools & Stack
- Node.js + Express.js
- Passport.js (Google OAuth)
- Multer (file uploads)
- Axios (image download)
- EJS (templating)
- Vanilla CSS
- File-based storage (JSON)

### Project Structure
```
├── index.js                # Main server file
├── auth.js                 # Passport config
├── package.json            # Dependencies
├── data/
│   ├── images.json         # Image database
│   └── backup.json         # Deleted images backup
├── public/
│   ├── styles.css          # Main stylesheet
│   └── uploads/            # Uploaded images
├── utils/
│   └── getColor.js         # Dominant color extraction
└── views/
    ├── add-img.ejs         # Add image form
    ├── home.ejs            # Home/gallery
    ├── show-img.ejs        # Gallery with filters
    ├── 404.ejs             # Custom 404 page
    ├── login-required.ejs  # Login prompt
    ├── goodbye.ejs         # Logout page
    └── partials/
        ├── navbar.ejs      # Navigation bar
        └── footer.ejs      # Footer
```

### Installation & Usage
1. Clone the repo and install dependencies:
   ```sh
   npm install
   ```
2. Set up your Google OAuth credentials in `auth.js` (see comments in file).
3. Start the server:
   ```sh
   npm run dev
   # or
   node index.js
   ```
4. Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Español

Esta app de galería de imágenes es un projecto puntuado del módulo UF1844, es parte de Bootcamp de Ironhack y de la formación de certificación profesional IFCD0210.

Usa la app [aquí](https://pic-gallery-uf1844.onrender.com)*       
_<sub>*Puede tardar unos 30 segundos debido a las limitaciones del hosting</sub>_


### Funcionalidades
- Autenticación de usuarios con Google (OAuth vía Passport.js)
- Añadir imágenes por URL o subiendo archivos
- Extracción automática del color dominante de la imagen
- Galería de imágenes con búsqueda y filtro por título y fecha
- Eliminar imágenes (con copia de seguridad y borrado de archivo)
- Interfaz moderna y responsive con EJS y CSS
- Página de error 404 personalizada con navegación

### Herramientas y Stack
- Node.js + Express.js
- Passport.js (OAuth Google)
- Multer (subida de archivos)
- Axios (descarga de imágenes)
- EJS (plantillas)
- CSS puro
- Almacenamiento en archivos (JSON)

### Estructura del Proyecto
```
├── index.js                # Archivo principal del servidor
├── auth.js                 # Configuración de Passport
├── package.json            # Dependencias
├── data/
│   ├── images.json         # Base de datos de imágenes
│   └── backup.json         # Copia de seguridad de eliminadas
├── public/
│   ├── styles.css          # Hoja de estilos principal
│   └── uploads/            # Imágenes subidas
├── utils/
│   └── getColor.js         # Extracción de color dominante
└── views/
    ├── add-img.ejs         # Formulario para añadir imagen
    ├── home.ejs            # Inicio/galería
    ├── show-img.ejs        # Galería con filtros
    ├── 404.ejs             # Página 404 personalizada
    ├── login-required.ejs  # Aviso de login
    ├── goodbye.ejs         # Página de despedida
    └── partials/
        ├── navbar.ejs      # Barra de navegación
        └── footer.ejs      # Pie de página
```

### Instalación y Uso
1. Clona el repositorio e instala las dependencias:
   ```sh
   npm install
   ```
2. Configura tus credenciales de Google OAuth en `auth.js` (ver comentarios en el archivo).
3. Inicia el servidor:
   ```sh
   npm run dev
   # o
   node index.js
   ```
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
