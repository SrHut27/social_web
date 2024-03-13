const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
// Importando a conexão com o banco de dados 
const connection = require('./configs/database');

// Rota para redirecionar para o index quando logado:
const post = require('./post')

// Importando funções produzidas por mim : ):
const {
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail,
    generateResetToken
} = require('./email/funcoes');

connection.connect((err) => {
    if(err) throw err;
    console.log("Connected to database!")
});

// Rotas GET e POST do cadastro de usuário
router.get('/register', async (req, res) => {
    
    res.render('register', { errors: req.session.errors });//Renderizando o meu formulçário para o usuário
});

router.post('/register', async (req, res) => {
    req.session.errors = []; // Se houver erros de sessões, serão limpos antes de exibir outro

    const {name, email, competencia, password, confirm_password} = req.body; // Pegando as informações obtidas do formulário

    connection.query('SELECT * from users WHERE email = ?', [email], async (err, results) => {
        if(err) { // capturando erro se não conseguir conectyar com o banco de dados
        req.session.errors.push('Houve um erro ao cadastrar o usuário. Por favorm tente novamente mais tarde.');
        return res.redirect('/auth/register');};

    // Verificar se alguma campo não foi preenchido:
    if (!name || !email || !password || !competencia) {
        req.session.errors.push('Um ou mais campos não foram preenchidos. Por favor, preencha para que o cadastro seja realizado.');
        return res.redirect('/auth/register');
    };

    //Vamos verificar se o email digitado já está cadastrado em nosso db
    if(results.length>0){
        req.session.errors.push('Este email já está cadastrado em uma outra conta.');
        return res.redirect('/auth/register');};

    // Veriificar se o usuário colocou as senhas iguais
    if(password != confirm_password) {
        req.session.errors.push('As senhas não coicidem. Por favor, tente novamente.')
        return res.redirect('/auth/register');};

    //Verificando se a senha é forte e pode ser cadastrada:
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*()])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if(!passwordRegex.test(password)) {
        req.session.errors.push('A senha deve conter pelo menos 8 caracteres, incluindo pelo menos um número, uma letra maiúscula, uma letra minúscula e um caractere especial.');
        return res.redirect('/auth/register');
    };
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Inserir usuário no banco de dados com senha criptografada e user_approved como falso
        connection.query('INSERT INTO users (name, email, competencia, password ) VALUES (?, ?, ?, ?)', [name, email, competencia, hashedPassword], async (err, results) => {
            if (err) {
                console.error('Erro ao inserir usuário: ', err);
                req.session.errors.push('Erro ao cadastrar usuário. Por favor, tente novamente mais tarde.');
                return res.redirect('/auth/register');
            };

                req.session.success = true;
                // Limpar os erros da sessão
                req.session.errors = [];
                // Redirecionar para a tela de login após o registro bem-sucedido
                res.redirect('/auth/login');
            });
        } catch {
            console.error('Erro ao criptografar a senha: ', err);
            req.session.errors.push('Erro ao cadastrar usuário. Por favor, tente novamente mais tarde.');
            return res.redirect('/auth/register');
        }

    });

});

// Rota GET e POST do cadastro de usuário
router.get('/login', (req, res) => {
    res.render('login', {errors: req.session.errors })
})

router.post('/login', (req, res)=>{
    const { email, password} = req.body;

    // Limpando os erros da sessão:
    req.session.errors = [];

    if (!email || !password) {
        req.session.errors.push('Se deseja logar no sistema, informe seus dados.')
        return res.redirect('/auth/login')
    }

    // Verificando se o usuário existe no banco de dados:
    connection.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if(err){
            console.log('Usuário não encontrado');
            req.session.errors.push('Este email não está vinculado a nenhuma conta. Cadastre-se no sistema.')
            return res.redirect('/auth/login');
        };

        if(results.length === 0){
            req.session.errors.push('Credenciais inválidas. Por favor, verifique seus dados e tente novamente');
            return res.redirect('/auth/login');
        };

        const user = results[0];

        try{
            const passwordMatching = await bcrypt.compare(password, user.password);

            if (!passwordMatching) {
                req.session.errors.push('Credenciais inválidas. Por favor, verifique seus dados e tente novamente');
                return res.redirect('/auth/login');
            }

            // Se as creedenciais estivrem corretas
            req.session.errors = [];
            req.session.user = user;
            res.redirect('/post');
        } catch (err) {
            console.error('Erro ao verificar a senha: ', err);
            req.session.errors.push('Erro ao tentar fazer login. Por favor, tente novamente mais tarde.');
            return res.redirect('/post');
        }
    })

})

// Rota para exibir o formulário de esqueci minha senha:
router.get('/forgot_password', (req, res) => {
    res.render('forgot_password', {errors: req.session.errors});
})

// Rota para lidar com o envio do formulário de esqueci minha senha:
router.post('/forgot_password', async (req, res) => {
    req.session.errors = [];

    const { email } = req.body;

    // Verificando se o email informado realmente existe no banco de dados:
    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results)=> {
        if (err){
            console.log('Erro ao verificar email:', err);
            return res.redirect('/auth/forgot_password');
        };

        if(results.length === 0){
            req.session.errors.push('O email fornecido não está associado a nenhuma conta');
            return res.redirect('/auth/forgot_password');
        };

        // Se não der nenhum erro, gera um token para recuperação de senha:
        const resetToken = generateResetToken();
        const userId = results[0].id;

        connection.query('UPDATE users SET reset_token = ? WHERE id = ?', [resetToken, userId], (err) => {
            if (err) {
                console.log('Houve um erro na conexão com o banco de dados:', err);
                return res.redirect('/auth/forgot_password');
            };

            // Enviando o email de recuperação com o link para recuperar a senha:
            sendPasswordResetEmail(email, resetToken);

            // Limpando os erros da sessão:
            req.session.errors.push('Um email foi enviado para você para você recuperar sua senha');

            return res.redirect('/auth/login')
        });
    });
});

// Rota para a redefrimição da senha:
router.get('/reset_password/:token', async (req, res) => {
    const { token } = req.params;

    // Verificar se o token existe no banco de dados
    connection.query('SELECT * FROM users WHERE reset_token = ?', [token], (err, results) => {
        if (err) {
            console.error('Erro ao verificar o token de redefinição de senha: ', err);
            // Tratar o erro de acordo com sua lógica de aplicativo
            return res.redirect('/auth/forgot_password');
        }

        if (results.length === 0) {
            // Se o token não existe no banco de dados, redirecione para uma página de erro ou de expiração de token
            req.session.errors.push('Não foi encontrado o seu pedido para recuperação de senha.')
            return res.render('/auth/login');
        }

        // Renderizar o formulário de alteração de senha, passando também os erros, se houverem
        res.render('reset_password', { token, errors: req.session.errors });
    });
});

router.post('/reset_password/:token', async (req, res) =>{
    if (!req.session.errors) {
        req.session.errors = [];
    }
    const { token } = req.params;
    const { password, confirm_password} = req.body;

    // Verifricaqndo se as senhas informadas são igauis:
    if (password != confirm_password) {
        req.session.errors.push('As senhas não coicidem!');
        return res.redirect(`/auth/reset_password/${token}`);
    };

    // Verificar se a senha atende aos critérios de segurança
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*()])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
        req.session.errors = ['A senha deve conter pelo menos 8 caracteres, incluindo pelo menos um número, uma letra maiúscula, uma letra minúscula e um caractere especial.'];
        return res.redirect(`/auth/reset_password/${token}`);
    };

    // Verificando se o token existe no banco de dados:
    connection.query('SELECT * FROM users WHERE reset_token = ?', [token], async (err, results) => {
        if (err) {
            console.error('Erro ao verificar o token de redefinição de senha: ', err);
            return res.redirect('/auth/forgot_password'); 
        };

        if (results.length === 0) {
            req.session.errors.push('Não foi encontrado o seu pedido para recuperação de senha.')
            return res.render('/auth/login');
        };

        const user = results[0];

        try {
            // Criptografando a nova senha:
            const hashedPassword = await bcrypt.hash(password, 10);

            // Atualziando a senhya e colocando o token igual a nulo:
            connection.query('UPDATE users SET password = ?, reset_token = NULL WHERE id = ?', [hashedPassword, user.id], async (err) => {
                if (err) {
                    console.error('Erro ao atualizar a senha: ', err);
                    return res.redirect('/auth/forgot_password');
                };

                // Enviando um email para o usuário para informar que sua senha foi alterada
                sendPasswordResetConfirmationEmail(user.email);

                req.session.errors = [];
                res.redirect('/auth/login');
            });
        } catch (error) {
            console.error('Erro ao criptografar a senha: ', error);
            res.render('reset_password', { errors: req.session.errors, token });
        };
    });
});

// Rota provisória para logout:
router.get('/logout', (req, res) => {
    req.session.destroy(err =>{
        if(err) {
            console.log('Não foi possível desconectar. Aguarde.')
        } else {
            return res.redirect('/auth/login')
        }
    })
})


module.exports = router;