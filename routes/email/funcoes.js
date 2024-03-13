const nodemailer = require('nodemailer');
require('dotenv').config();

//Configurando o nodemailer, que será responsável pela recuperação de usuário quando tal esquecer sua senha. Em uma aplicação real, você deve colocar uma senha feita para aplicativos.
const transporter = nodemailer.createTransport({
    service: process.env.SERVICE_EMAIL,
    auth: {
        user: process.env.SERVICE_USER,
        pass: process.env.SERVICE_PASS
    }
});

function sendPasswordResetEmail(email, resetToken){
    const mailOptions = {
        from:  'youremailhere@email.com',
        to: email, // Passamos aqui o parâmetro do email que pediu a recuperação
        subject: 'Recuperação de senha',
        html:
        `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
            <p>Olá,</p>
            <p>Esqueceu sua senha do sistema ______, com o email: ${email}?</p>
            <p>Para redefinir sua senha, clique no botão abaixo:</p>
            <a href="http://localhost:3000/auth/reset_password/${resetToken}" style="display: inline-block; padding: 10px 20px; background-color: #00642c; color: #fff; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
            <p style="margin-top: 20px;">Se você não solicitou uma redefinição de senha, ignore este email.</p>
            <p style="margin-top: 20px;">Atenciosamente,</p>
            <p style="font-weight: bold;">Suco Maria Peregrina</p>
        </div>
    `
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error){
            console.log('Não foi possível enviar o email de recuperação do usuário', err)
        } else {
            console.log('Email de recuperação enviado com sucesso.')
        };
    });
};

// Função para enviar o email de confirmação de alteração de senha
function sendPasswordResetConfirmationEmail(email) {
    const mailOptions = {
        from: 'youremail@email.com',
        to: email,
        subject: 'Confirmação de Alteração de Senha',
        html: `
            <p>Sua senha foi alterada com sucesso no sistema ________, com o email: ${email}.</p>
            <p>Se você não realizou esta alteração, entre em contato conosco imediatamente. Clique no link ou contate-nos pelo telefone: (xx) xxxxx-xxxx</p>
        `
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.error('Erro ao enviar email de confirmação de alteração de senha: ', error);
        } else {
            console.log('Email de confirmação de alteração de senha enviado com sucesso.');

        }
    });
}

// Função simples para gerar um token aleatório de recuperação:
function generateResetToken(){
    const tokenLength = 30;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i< tokenLength; i++ ){
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    };
    return token;
};

// Exportanto essas funções:
module.exports = {
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail,
    generateResetToken
};