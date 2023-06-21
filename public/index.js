var socket = io();

function createCarousel() {
    // Seleciona o elemento com a classe 'container-slider'.
    var containerSlider = document.querySelector('.container-slider');

    // Cria um novo elemento div e adiciona a classe 'owl-carousel'.
    var owlCarousel = document.createElement('div');
    owlCarousel.className = 'owl-carousel';
    // Array com as classes e o texto das divs a serem criadas.
    var divData = [
        { id: '1_red', classes: 'pedra red 1', text: '1' },
        { id: '9_black', classes: 'pedra black', text: '9' },
        { id: '2_red', classes: 'pedra red', text: '2' },
        { id: '10_black', classes: 'pedra black', text: '10' },
        { id: '3_red', classes: 'pedra red', text: '3' },
        { id: '11_black', classes: 'pedra black', text: '11' },
        { id: '4_red', classes: 'pedra red', text: '4' },
        { id: '12_black', classes: 'pedra black', text: '12' },
        { id: '5_red', classes: 'pedra red', text: '5' },
        { id: '13_black', classes: 'pedra black', text: '13' },
        { id: '6_red', classes: 'pedra red', text: '6' },
        { id: '14_black', classes: 'pedra black', text: '14' },
        { id: '7_red', classes: 'pedra red', text: '7' },
        { id: '1_black', classes: 'pedra black', text: '1' },
        { id: '0_white', classes: 'pedra white', text: '⚄' },
        { id: '8_red', classes: 'pedra red', text: '8' },
        { id: '2_black', classes: 'pedra black', text: '2' },
        { id: '9_red', classes: 'pedra red', text: '9' },
        { id: '3_black', classes: 'pedra black', text: '3' },
        { id: '10_red', classes: 'pedra red', text: '10' },
        { id: '4_black', classes: 'pedra black', text: '4' },
        { id: '11_red', classes: 'pedra red', text: '11' },
        { id: '5_black', classes: 'pedra black', text: '5' },
        { id: '12_red', classes: 'pedra red', text: '12' },
        { id: '6_black', classes: 'pedra black', text: '6' },
        { id: '13_red', classes: 'pedra red', text: '13' },
        { id: '7_black', classes: 'pedra black', text: '7' },
        { id: '14_red', classes: 'pedra red', text: '14' },
        { id: '8_black', classes: 'pedra black', text: '8' }
    ];

    // Para cada item no array divData, cria uma nova div e adiciona ao 'owl-carousel'.
    divData.forEach(function (item) {
        var div = document.createElement('div');
        div.id = item.id;
        div.className = item.classes;
        div.textContent = item.text;
        owlCarousel.appendChild(div);
    });

    // Adiciona o 'owl-carousel' ao 'container-slider'.
    containerSlider.appendChild(owlCarousel);
}

// Chama a função para criar o carousel.
createCarousel();

/////////////////////////////////////////////////////////

//QUANDO CARREGA TODOS ELEMENTOS DA PÁGINA:

$(document).ready(function () {
    //DEPENDENCES:
    const socket = io('http://localhost:3000/');

    /////////////////////////////////////////////////////////

    //GLOBAL VARIABLES INICIALIZATION:
    var wallet;
    var bet = {
        amount: 0,
        color: ''
    };
    var timerElement = $('.timer');
    var carousel = $('.owl-carousel');
    var betColorActive = '';


    /////////////////////////////////////////////////////////

    //SOCKETS:

    //Atualiza o valor da carteira:
    socket.on('updateValueWallet', (value) => {
        wallet = parseFloat(value);
        $('.wallet').text('R$ ' + wallet.toFixed(2));
    });

    socket.on('updateStats', (dataColor, dataNumber) => {
        createDivStats(dataColor, dataNumber);
    })

    socket.on('recriateDiv', (sinal) => {
        if(sinal == true){
            //Recria o carrossel:
            recreateCarousel();
        }
    })

    //Atualiza a contagem de tempo para a proxima partida:
    socket.on('countdown', (tempCountdown) => {
        timerElement.show();
        timerElement.text('A roleta inicia em ' + tempCountdown + ' segundos');
        var progressBar = document.getElementById('progressbar');

        // Se você sabe o tempo máximo (em segundos), substitua `maxTime` pelo valor apropriado.
        var maxTime = 16; // por exemplo, 60 segundos.
        var progress = (tempCountdown / maxTime) * 100;

        // Atualize a barra de progresso.
        progressBar.value = progress;
    });

    //Partida ativa:
    socket.on('play', (isPlay, result) => {
        //Se partida estiver ativa:
        if (isPlay == true) {
            timerElement.hide();
            carousel.trigger('play.owl.autoplay');
            $('.bet-option').addClass('inactive'); // torna os botões inativos.
            $('.bet').addClass('inactive'); // torna os botões inativos.
            $('.uk-progress').addClass('apagar-tela');
        }
        //Se a partida acabou: 
        else {
            // O carrossel para de girar.
            carousel.trigger('stop.owl.autoplay');

            // Algoritmo para parar o carrossel na posição correta de acordo com o resultado.
            carousel.trigger('to.owl.carousel', result);

            var resultColor = $('.owl-item.active .pedra').eq(2).attr('class').split(' ')[1];
            var resultNumber = $('.owl-item.active .pedra').eq(2).attr('id').split('_')[0];
            console.log(resultNumber)
            socket.emit('result', resultColor, bet.color, resultNumber);

            // Exibe o resultado no overlay:
            $('.overlay-content').html("Selecionado: " + resultColor.toUpperCase() + " " + resultNumber.toUpperCase());
            $('.overlay').fadeIn(500).delay(5000).fadeOut(500);

            bet = { amount: 0, color: '' };
            $('.bet-option').removeClass('inactive');
            $('.bet').removeClass('inactive');
            $('.uk-progress').removeClass('apagar-tela');
        }
    });


    /////////////////////////////////////////////////////////

    //FUNCTIONS:

    function createDivStats(dataColor, dataNumber) {

        // Seleciona o elemento pai.
        var statsContainer = document.getElementById("stats");
        //Zera o elemento pai para evitar acrescentar o historico e ter blocos repetidos:
        statsContainer.innerHTML = "";

        //Coloca o historico de blocos de cores:
        for (let i = 0; i < dataColor.length; i++) {

            // Cria as divs internas.
            let div = document.createElement("div");
            div.className = "stats-card";
            div.style.backgroundColor = dataColor[i];
            //adapta o tamanho dos cards ja sorteados o tamanho mobile
            if (window.innerWidth <= 768) {
                div.style.width = "11vw"; // Define a largura do card como 100 pixels.
                div.style.height = "11vw"; // Define a altura do card como 100 pixels.
            } else {
                div.style.width = "100px"; // Define a largura do card como 100 pixels.
                div.style.height = "100px"; // Define a altura do card como 100 pixels.
            }
            div.style.marginRight = "10px";
            div.style.marginBottom = "7px";

            let number = document.createElement("span");
            number.style.color = "white";
            number.textContent = dataNumber[i];

            // Adiciona o número à div interna.
            div.appendChild(number);

            // Adiciona as divs internas ao elemento pai.
            statsContainer.appendChild(div); // Adiciona o novo card no final do container de estatísticas.
        }
    }

    function recreateCarousel() {
        // Remove o carrossel existente.
        $('.owl-carousel').owlCarousel('destroy');
        $('.owl-carousel').remove();
    
        // Chama a função para criar o carrossel novamente.
        createCarousel();
    
        // Se for móvel, use a configuração apropriada.
        if (window.innerWidth <= 768) {
            $('.owl-carousel').owlCarousel({
                items: 5,
                loop: true,
                nav: false,
                dots: false,
                mouseDrag: false,
                touchDrag: false,
                autoplay: false,
                autoplayTimeout: 120,
                autoplaySpeed: 120,
                autoplayHoverPause: false,
                autoWidth: true
            });
            $('.owl-carousel .item').css('width', '50px');
            $('.owl-carousel').trigger('refresh.owl.carousel');
        } else {
            $('.owl-carousel').owlCarousel({
                items: 5,
                loop: true,
                nav: false,
                dots: false,
                mouseDrag: false,
                touchDrag: false,
                autoplay: false,
                autoplayTimeout: 120,
                autoplaySpeed: 120,
                autoplayHoverPause: false
            });
        }
    }


    /////////////////////////////////////////////////////////

    //EVENTS:

    //Ao clicar em um dos campos de aposta:
    $('.bet-option').click(function () {
        var betColor = $(this).data('color');
        $('.bet-option').css('border', 'none');//Remove a borda de todos os botões de aposta.
        $(this).css('border', '2px solid green');//Define a borda para o botão clicado.
        betColorActive = betColor;
        console.log(betColorActive);
    });

    //Ao clicar no botão para confirmar aposta:
    $('#betButton').click(function () {
        if (betColorActive != 'black' && betColorActive != 'red' && betColorActive != 'white') { return alert('Cor não selecionada!') }
        var betAmount = parseFloat($('.bet-value').val());
        if (betAmount > wallet || betAmount < 0) { return alert('Aposta inválida.'); }
        bet.amount = betAmount;
        bet.color = betColorActive;
        socket.emit('registerBet', betAmount, betColorActive);//Envia e registra ao servidor a aposta feita;
        $('.bet-option').addClass('inactive'); //Torna os botões opacos depois de uma aposta.
        $('.bet').addClass('inactive'); // Torna a div inativa.
        $('.bet-option').css('border', 'none');//Remove a borda de todos os botões de aposta.
        betColorActive = '';
    });

    //alterada para se adaptar ao formato certo
    if (window.innerWidth <= 768) { // 768px é geralmente a largura usada para distinguir dispositivos móveis

        // Antes de iniciar o carrossel, destrua a instância anterior se existir
        if ($('.owl-carousel').data('owl.carousel')) {
            $('.owl-carousel').owlCarousel('destroy');
        }

        $('.owl-carousel').owlCarousel({
            items: 5,
            loop: true,
            nav: false,
            dots: false,
            mouseDrag: false,
            touchDrag: false,
            autoplay: false,
            autoplayTimeout: 120,
            autoplaySpeed: 120,
            autoplayHoverPause: false,
            autoWidth: true  // Agora definimos autoWidth para true
        });

        // Atualize a largura de cada item
        $('.owl-carousel .item').css('width', '50px');

        // Agora reforce a atualização do carrossel
        $('.owl-carousel').trigger('refresh.owl.carousel');

    } else {

        carousel.owlCarousel({
            items: 5,
            loop: true,
            nav: false,
            dots: false,
            mouseDrag: false,
            touchDrag: false,
            autoplay: false,
            autoplayTimeout: 120,
            autoplaySpeed: 120,
            autoplayHoverPause: false
        });

    }

});