
class DataFunctionsDouble {

    constructor(io, currentWallet, timerNextRound, valueBet = 0, historic = [], db) {
        this.db = db;//Objeto da classe do banco de dados.
        this.io = io;//Objeto do Socket.io.
        this.currentWallet = currentWallet;//Valor atual da carteira.
        this.timerNextRound = timerNextRound;//Tempo para a proxima partida.
        this.valueBet = valueBet;//Valor da aposta.
        this.historic = historic;//Historico das ultimas partidas.
    }

    //GETTERS:
    get wallet() { return this.currentWallet; }
    get nextRoundTimer() { return this.timerNextRound; }
    get _valueBet() { return this.valueBet; }
    get allHistoric() { return this.historic; }

    //SETTERS:
    set wallet(value) { this.currentWallet = value; }
    set nextRoundTimer(value) { this.timerNextRound = value; }
    set _valueBet(value) { this.valueBet = value; }
    set allHistoric(value) { this.historic = value; }

    //FUNCTIONS:

    //Funcao de contador para a proxima partida:
    timeForNextRound(time = 15) {
        let tempCountdown = time;
        let interval = setInterval(() => {
            tempCountdown--;
            this.io.emit('countdown', tempCountdown);

            if (tempCountdown <= 0) {
                clearInterval(interval);
                let randomNumber = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1333;
                this.play(randomNumber);
            }
        }, 1000); //Atualiza o contador a cada segundo;
    }

    //Funcao durante a partida:
    play(turningTimeInMilliseconds = 1000) {
        let countdown = 5;
        let interval = setInterval(() => {
            countdown--;
            this.io.emit('play', true);//True significa que a partida ta em jogo;

            if (countdown <= 0) {
                clearInterval(interval);
                let randomResultNumber = Math.floor(Math.random() * 14);
                this.io.emit('play', false, randomResultNumber);
                this.timeForNextRound();
            }
        }, turningTimeInMilliseconds); //Atualiza o contador a cada segundo;
    }

    //Funcao que, logo após acabar a partida, culcula e atualiza o valor da aposta do usuario: OK!
    calculateValueWonAndLost(resultColor, betColor, resultNumber) {
        this.historic.push(resultColor);
        //console.log(this.historic); //Ver o historico das ultimas cores no console;
        this.db.endSet(resultColor, resultNumber);//Envia ao banco de dados e atualiza o resultado da partida;
        this.updateStats();//Da update do novo no display do usuario mostrando o historico das ultimas partidas.
        this.db.getStats();//Mostra no console os dados que ja estão na tabela online do banco de dados;
        let multiplyBet = [2, 14];//Quantidade de vezes multiplicadas se ganhar; ITEM-1 = PRETO E VERMELHO, ITEM-2 = BRANCO;
        if (resultColor == betColor) {
            if (resultColor == 'white') {
                this.currentWallet = this.currentWallet + (this.valueBet * multiplyBet[1]);
            } else { this.currentWallet = this.currentWallet + (this.valueBet * multiplyBet[0]); }
        }
        this.valueBet = 0;//Reinicia o valor de aposta;
    }

    //Funcao para atualizar o painel de estatisticas:
    updateStats() {
        this.db.getStats()//Funcao da classe db para pegar da tabela as estatisticas.
            .then((resultStats) => {
                this.io.emit('updateStats', resultStats.map(objeto => objeto.color), resultStats.map(objeto => objeto.color_number));
            })
            .catch((error) => {
                console.error('Erro ao obter/enviar os dados:', error);
            });
    }

}

//EXPORTANDO CLASSE:
module.exports = DataFunctionsDouble;