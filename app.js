// Colocando segurança na porta, contas e etc.
require('dotenv').config();
const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require('handlebars');
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
    defaultLayout: 'main' // será o layout base para todos os outros
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

// ATENÇÃO, muito importante para os próximos projetos:
// Essa lógica permite que você possa carregar qualquer arquivo no template do handlebars, pois está retornando a extensão e repassando para o template

// Helper para verificar se a extensão do arquivo é de uma imagem
Handlebars.registerHelper('isImage', function(fileExtension, options) {
    return fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png';
});

// Helper para verificar se a extensão do arquivo é de um vídeo
Handlebars.registerHelper('isVideo', function(fileExtension, options) {
    return fileExtension === 'mp4';
});


// Midleware para configurar mensagens de erro próppria:
app.use((req, res, next) => {
    res.locals.messages = req.session.messages || [];
    req.session.messages = [];
    next()
}); 

//Importando as rotas de métodos do auth.js:
app.use('/auth', authRoutes);
app.use('', postRoutes)


// Iniciando a porta do servidor
app.listen(PORT, () =>{
    console.log("Server is running in http://localhost:" + PORT);
})