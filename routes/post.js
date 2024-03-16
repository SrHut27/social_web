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
const query = `
    SELECT 
        posts.*,
        users.name AS author_name,
        GROUP_CONCAT(comment.id_user) AS comment_user_ids,
        GROUP_CONCAT(comment.id) AS comment_ids,
        GROUP_CONCAT(comment.comentarios SEPARATOR '|') AS comentarios,
        GROUP_CONCAT(users_comment.name SEPARATOR '|') AS autorescomentarios
    FROM
        posts
    LEFT JOIN
        comment ON posts.id = comment.id_post
    LEFT JOIN
        users ON posts.id_user = users.id
    LEFT JOIN
        users AS users_comment ON comment.id_user = users_comment.id
    GROUP BY posts.id
    ORDER BY posts.created_at DESC;
`;
    
        connection.query(query, (error, results)=>{
            if(error){
                console.log('Não foi possível conectar ao banco de dados, por favor, aguarde');
                return res.redirect('/post');
            };

            // Mapeando os resultados para garantir que cada post tenha a propriedade 'comments' definida como um array vazio
            const postsWithComments = results.map(post => {
                if (post.comentarios) {
                    post.comments = post.comentarios ? post.comentarios.split('|').map((comment, index) => ({
                        texto: comment,
                        autor: post.autorescomentarios.split('|')[index],
                        comment_user_id: post.comment_user_ids ? post.comment_user_ids.split('|')[index]: undefined, // Assuming you have an aggregated column 'comment_user_ids'
                        comment_id: post.comment_ids ? post.comment_ids.split('|')[index]: undefined, // Assuming you have an aggregated column 'comment_ids'
                    })) : [];
                } else {
                    post.comments = [];
                }
                return post;
            });

            res.render('index' ,{username: req.session.user.name,session: req.session, posts: postsWithComments });
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

        connection.query('INSERT into comment (id_user, id_post, comentarios) VALUES (?, ?, ?)', [userId, id_post, comment_text], (error, results) => {
            if (error){
                console.log('Erro ao inserir comentário no banco de dados:', error);
                return res.redirect('/post')
            }
            return res.redirect('/post');
        });
    } else {
        return res.redirect('/auth/login')
    }
});

router.post('/post/delete/:id', (req, res) => {
    const postId = req.params.id;
    const userId = req.session.user.id;

    // Verifica se o usuário logado é o autor da publicação
    connection.query('SELECT * FROM posts WHERE id = ? AND id_user = ?', [postId, userId], (error, results) => {
        if (error) {
            console.log('Erro ao verificar a autoria da publicação:', error);
            return res.redirect('/post');
        }

        // Se o usuário for o autor da publicação, procede com a exclusão
        if (results.length > 0) {
            // Primeiro, exclui os comentários associados à publicação
            connection.query('DELETE FROM comment WHERE id_post = ?', [postId], (commentDeleteError, commentDeleteResults) => {
                if (commentDeleteError) {
                    console.log('Erro ao excluir os comentários:', commentDeleteError);
                }

                // Após excluir os comentários, exclui a publicação
                connection.query('DELETE FROM posts WHERE id = ?', [postId], (deleteError, deleteResults) => {
                    if (deleteError) {
                        console.log('Erro ao excluir a publicação:', deleteError);
                    }
                    return res.redirect('/post');
                });
            });
        } else {
            // Se o usuário não for o autor da publicação, redireciona de volta para as postagens
            return res.redirect('/post');
        }
    });
});

router.post('/comment/delete/:id', (req, res) => {
    const commentId = req.params.id;
    const userId = req.session.user.id;

    // Verifica se o usuário logado é o autor do comentário a ser excluído
    connection.query('SELECT * FROM comment WHERE id = ? AND id_user = ?', [commentId, userId], (error, results) => {
        if (error) {
            console.log('Erro ao verificar a autoria do comentário:', error);
            return res.redirect('/post');
        }

        // Se o usuário for o autor do comentário, procede com a exclusão
        if (results.length > 0) {
            connection.query('DELETE FROM comment WHERE id = ?', [commentId], (deleteError, deleteResults) => {
                if (deleteError) {
                    console.log('Erro ao excluir o comentário:', deleteError);
                }
                return res.redirect('/post');
            });
        } else {
            // Se o usuário não for o autor do comentário, verificar se ele é o autor da publicação associada ao comentário
            connection.query('SELECT id_post FROM comment WHERE id = ?', [commentId], (postIdError, postIdResults) => {
                if (postIdError) {
                    console.log('Erro ao obter o ID da publicação associada ao comentário:', postIdError);
                    return res.redirect('/post');
                }

                const postId = postIdResults[0].id_post;

                // Verificar se o usuário é o autor da publicação associada ao comentário
                connection.query('SELECT * FROM posts WHERE id = ? AND id_user = ?', [postId, userId], (postError, postResults) => {
                    if (postError) {
                        console.log('Erro ao verificar a autoria da publicação associada ao comentário:', postError);
                        return res.redirect('/post');
                    }

                    // Se o usuário for o autor da publicação associada ao comentário, procede com a exclusão
                    if (postResults.length > 0) {
                        connection.query('DELETE FROM comment WHERE id = ?', [commentId], (deleteError, deleteResults) => {
                            if (deleteError) {
                                console.log('Erro ao excluir o comentário:', deleteError);
                            }
                            return res.redirect('/post');
                        });
                    } else {
                        // Se o usuário não for o autor do comentário nem da publicação associada, redireciona de volta para as postagens
                        return res.redirect('/post');
                    }
                });
            });
        }
    });
});






module.exports = router;