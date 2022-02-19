const express = require('express');
const router = express.Router()
const Users = require("../Database/query")
const bcrypt = require('bcrypt')
const multer = require('multer');
const path = require('path');
const fs = require('fs')
const auth = require('../middleware/auth')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "public/uploads/")
    },
    filename: function(req, file, cb){
        cb(null, file.originalname + Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({ storage })

router.get('/user/cadastro', (req, res) =>{
    var erro = req.flash("erro")
    var nome = req.flash("nome")
    var email = req.flash("email")

    erro = (erro == undefined || erro.length == 0) ? undefined:erro
    nome = (nome == undefined || nome.length == 0) ? undefined:nome
    email = (email == undefined || email.length == 0) ? undefined:email

    res.render("users/cadastrar", {nome: nome, email: email, erro: erro})
})

router.get('/login', (req, res) => {
    var erro = req.flash("erroLogin")
    erro = (erro == undefined || erro.length == 0) ? undefined:erro
    res.render("users/login", {erro: erro})
})

router.get('/upload', (req, res) => {
    var user = req.session.resultado.id
    if(user != undefined){
        Users.findByPk(user).then(resultado => {
            res.render("parciais/upload.ejs", {foto: resultado.foto})
        })
    }else{
        res.redirect('/login')
    }
})

router.post('/upload', upload.single('img'), async (req, res) => {
    var usuario = req.session.resultado
    var img = req.file

    if(img != undefined){
        img = img.path.replace("public", "")
        console.log(img)
    }

    if(usuario != undefined){
        try{
            var client = await Users.findByPk(usuario.id)
            console.log(client)
            if(client != undefined){
                var teste = client.foto
                console.log(teste)
                if(teste === 'assets/noprofile.jpg'){
                    Users.update({foto: img}, {where:{nome: usuario.nome}}).then(function(rowsUpdated){
                        res.redirect('/upload')
                    }).catch(e => {
                        console.log(e)
                    })
                }else{
                    var x = await fs.unlinkSync(`public/${client.foto}`)
                    console.log(x);
                    Users.update({foto: img}, {where:{nome: usuario.nome}}).then(function(rowsUpdated){
                        res.redirect('/upload')
                    }).catch(e => {
                        console.log(e)
                    })
                }
                
            }
        }catch(e){
            res.json({error: e})
        }
    }

})


router.post('/cadastro', upload.single('foto'), async (req, res)=>{
    var {nome,email,password} = req.body
    var foto = req.file

    console.log(foto)

    if(foto != undefined){
        foto = foto.path.replace('public', '')
        console.log(foto)
    }else{
        foto = 'assets/noprofile.jpg'
    }
    
    Users.findOne({where:{email: email}}).then(resultado => {
        if(resultado == undefined){
            var salt = bcrypt.genSaltSync(10)
            var hash = bcrypt.hashSync(password, salt)
                Users.create({
                    nome: nome,
                    email: email,
                    senha: hash,
                    foto: foto
                }).then(dado=>{
                    res.send(dado)
                }).catch(err => {
                    var erro = `Erro ao cadastrar o usuário \n${err}`
                    req.flash("erro", erro)
                    res.redirect("/cadastro") 
                })
        }else{
            var erro = `Erro ao cadastrar Usuário \nUsuário já cadastrado`
            req.flash("erro", erro)
            res.redirect("/cadastro")
        }
    })
    
})

router.get('/authentic', (req, res) => {
    var user = req.session.resultado.id
    if(user != undefined){
        Users.findByPk(user).then(resultado => {
            res.render('users/authentic', {nome: resultado.nome, foto: resultado.foto})
        })
    }else{
        res.redirect('/login')
    }
})

router.post('/logar', (req, res)=>{
    var {email, password, checkout} = req.body
    //SELECT * FROM users WHERE email="email informado no input" AND senha = "senha informada no input"
    if(email != '' && password != ''){
        Users.findOne({where:{email: email}}).then(resultado => {
            if(resultado != undefined){
                var correct = bcrypt.compareSync(password, resultado.senha)
                var user = resultado.nome
                if(correct){
                    req.session.resultado = {
                        id: resultado.id,
                        nome: user
                    }
                    res.redirect('/authentic')
                }else{
                    var erro = `Credenciais Inválidas`
                    req.flash("erroLogin", erro)
                    res.redirect('/login')
                }
            }else{
                res.send("Erro nas credenciais do usuário!")
            }
        })
    }else{
        res.redirect('/login')
    }
})

router.get("/logout", (req, res) => {
    req.session.resultado = undefined;
    res.redirect('/')
})

module.exports = router;