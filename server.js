//IMPORTS:
const DB = require("./db.js");//Importa a classe que mexe com banco de dados;
const DataFunctionsDouble = require('./script/script.js');//Importa a classe dos scripts do jogo;

//DEPENDENCIAS PACKAGES:
const express = require('express');// Carrega o módulo Express, um framework para desenvolvimento web no Node.js;
const http = require('http');// Carrega o módulo HTTP nativo do Node.js, que fornece funcionalidades de servidor HTTP;
const socketIo = require('socket.io');// Carrega o módulo Socket.IO, uma biblioteca que permite comunicação em tempo real bidirecional;
const path = require('path');// Carrega o módulo 'path' nativo do Node.js, que fornece utilitários para trabalhar com caminhos de arquivos e diretórios;
const app = express();// Cria uma nova instância do Express, que será usada para definir o servidor;
const server = http.createServer(app);// Cria um novo servidor HTTP usando a instância do Express;
const io = socketIo(server);// Integra o Socket.IO com o servidor HTTP, permitindo comunicações em tempo real através de WebSockets;


/////////////////////////////

//SOCKET/SERVIDOR:
const db = new DB();
db.connect();//Faz a conexao no banco de dados PostgreSQL;
const dataFunctionsDouble = new DataFunctionsDouble(io, 300, 15, 0, [], db);//Inicia a classe do script;

db.insertCustomer();//Inicia a tabela do primeiro jogo, o restante sera de forma automatica pelo script enquanto servidor estiver rodando.
dataFunctionsDouble.timeForNextRound();//Inicia o contador.

io.on('connection', (socket) => {
    console.log('Usuario conectado como: ' + socket.id);
    //Dá o update no display de historico das ultimas particas assim que o usuario loga.
    dataFunctionsDouble.updateStats();

    //Atualiza a carteira do cliente logo que ele se conecta.
    socket.emit('updateValueWallet', dataFunctionsDouble.wallet);

    //Atualiza a cada 1 segundo a carteira do usuario.
    setInterval(() =>{
        socket.emit('updateValueWallet', dataFunctionsDouble.wallet);
    },1000);

    //Recebe o resultado da partida apos seu fim:
    socket.on('result', (resultColor, betColor, resultNumber) => {
        dataFunctionsDouble.calculateValueWonAndLost(resultColor, betColor, resultNumber);//Calcula o valor da carteira com base na aposta.
        socket.emit('updateValueWallet', dataFunctionsDouble.wallet);///Emite e atualiza a carteira do usuario com seu novo saldo.
    })

    //Recebe e registra a aposta;
    socket.on('registerBet', (betAmount, betColor) => {
        dataFunctionsDouble.wallet = dataFunctionsDouble.wallet - betAmount;//Calcula a carteira com base no valor da aposta.
        dataFunctionsDouble._valueBet = betAmount;//Salva o valor apostado pelo usuario.
        db.setBet(betAmount);//Envia a aposta e soma ao banco de dados com o restante das apostas.
        socket.emit('updateValueWallet', dataFunctionsDouble.wallet);//Emite e atualiza a carteira do usuario com seu novo saldo.
    })

})


////////////////////////////

//EXPRESS/ROUTERS:

// Configure a pasta estática e defina o tipo MIME correto.
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});


////////////////////////////

//INICIALIZATION SERVER:

server.listen(3000, () => {
    console.log('Servidor ouvindo na porta 3000');
});