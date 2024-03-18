// Colocando segurança na porta, contas e etc.
require('dotenv').config();
const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser')
const session = require('express-session');
const helmet = require('helmet');
const PORT = 3000;
const app = express()
const path = require('path');
const fs = require('fs');


// Definin uma pasta para qrquivos não estáticos
const publicDir  = path.join(__dirname, 'public');
const uploadsDir = path.join(publicDir, 'uploads')

//Verificando se existe a pasta public, se não, criando-a
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Verificando se existe a pasta uploads
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

//Importando a conexão com o banco de dados:
const connection = require('./routes/configs/database');
//Importando as rotas do app:
const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/post')

// Iniciando a conexão com o servidor:
connection.connect((err) => {
    if(err) throw err; // Se houver um erro na conexão
    console.log('Connected to database!')
});

// Configurando o handlebars, que será nossa views engine:
app.engine('hbs', hbs.engine({
    extname: 'hbs', // Definimos aqui que a extensão dos arquivos de template será: hbs
    defaultLayout: 'main',
    helpers: {
        split: function (string, separator) {
            return string.split(separator);
        },
        isUsersPost: function(postUserId, sessionUserId) {
            return postUserId === sessionUserId;
        },
        isImage: function(fileExtension, options) {
            return fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png';
        },
        isVideo: function(fileExtension, options) {
            return fileExtension === 'mp4';
        },
        // Helper function to check if the user is the author of the comment
        isUsersComment: function(commentUserId, sessionUserId) {
            return commentUserId === sessionUserId;
        },
        allowCommentDeletion(sessionUserId, commentUserId, postUserId) {
            return sessionUserId === postUserId || sessionUserId === commentUserId;
        }
        
    } // será o layout base para todos os outros
}));

//Definindo o handlebars como o motor de renderização de templates:
app.set('view engine', 'hbs');

//Configurando os middlewares
app.use(helmet());
app.use(express.static('public')); // Falaqndo onde deixaremos nossos arquivos estátivcos
app.use(bodyParser.urlencoded({extended: true})); // permitindo o preocessamento de formulários
app.use(express.urlencoded({ extended: true }));
app.use(session({ // Configurando a sessão de usuário
    secret: 'yousecretkey',
    resave: true,
    saveUninitialized: true,
}));



//Importando as rotas de métodos do auth.js e das postagens:
app.use('/auth', authRoutes);
app.use('', postRoutes);

// Midleware para configurar mensagens de erro próppria:
app.use((req, res, next) => {
    res.locals.messages = req.session.messages || [];
    req.session.messages = [];
    next()
}); 

// Iniciando a porta do servidor
app.listen(PORT, () =>{
    console.log("Server is running in http://localhost:" + PORT);
})