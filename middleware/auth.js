function auth(req, res, next){
    if(req.session.resultado != undefined){
        console.log(req.session)
        next()
    }else{
        var erro = `É necessário realizar o login`
        req.flash('erroLogin', erro)
        res.redirect('/login')
    }
}

module.exports = auth