const express = require('express');
const path = require('path');
const router = express.Router();

//Imprtando a conexão com o banco de dados:
const connection = require('./configs/database');
const upload = require('./configs/multerConfig');


connection.connect ((err, results) => {
    if(err)throw err;
    console.log('Cant connect ', err)
    
})

router.get('/post', (req, res) => {
    if (req.session.user) {
        
        // Capturando as postagens:
        const query = 'SELECT * from posts ORDER BY created_at DESC';
        connection.query(query, (error, results)=>{
            if(error){
                console.log('Não foi possível conectar ao banco de dados, por favor, aguarde');
                return res.redirect('/post');
            };
            res.render('index' ,{username: req.session.user.name, posts: results });
        })
        
    } else{
        return res.redirect('/auth/login')
    }
});

router.get('/post/add', (req, res) => {
    if (req.session.user) {
        res.render('post_add', { errors: req.session.messages });

    } else {
        return res.redirect('/auth/login');
    }
});

router.post('/post/add', upload.single('arquivo'), (req, res) => {
    // Se req.file existir, significa que um arquivo foi enviado
    if (req.file) {
        const { pensamento, link } = req.body;
        const userId = req.session.user.id;
        const filePath = 'uploads/'+req.file.filename; // Dessa forma, especificando a pasta, você evita erro de não achar o arquivo depois
        const fileExtension = req.file.originalname.split('.').pop();
        
        connection.query('INSERT INTO posts (id_user, pensamento, link, arquivo, file_extension) VALUES (?, ?, ?, ?, ?)', [userId, pensamento, link, filePath, fileExtension], (error, results) => {
            if (error) {
                console.log('Erro ao inserir no banco de dados:', error);
                return res.redirect('/post/add');
            }
            return res.redirect('/post');
        });
    } else {
        // Se nenhum arquivo foi enviado, redirecionar de volta para a página de adição de postagem
        return res.redirect('/post/add');
    }
});

router.post('/post/comentario', (req, res) => {
    if (req.session.user){
        const { id_post, comment_text } = req.body;
        const userId = req.session.user.id;

        connection.query('INSERT into comment (id_user, id_post, comentarios) VALUES (?,?,?)', [userId, id_post, comment_text], (error, results) => {
            if (error){
                console.llog('Não foi possível conectar ao banco de dados', err);
                return res.redirect('/post')
            }
            return res.redirect('/post');
        });
    } else {
        return res.redirect('/auth/login')
    }
})

module.exports = router;