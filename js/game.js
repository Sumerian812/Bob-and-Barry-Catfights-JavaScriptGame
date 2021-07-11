// when window has loaded, run game
$(document).ready(function () {
    speechSynthesis.cancel();
    ///////////////////////////////////////// AUDIO SETUP ////////////////////////////////////////////////////////
    var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    msg.voice = voices[10]; // Note: some voices don't support altering params
    msg.voiceURI = 'native';
    msg.volume = 1; // 0 to 1
    msg.rate = 1; // 0.1 to 10
    msg.pitch = 1; //0 to 2
    msg.text = 'Welcome to Bob and Barry: Cat Fights. Bob gets the first turn.';
    msg.lang = 'en-US';

    var jump = new Audio('./assets/jump.mp3');
    jump.volume = 0.1;
    var collect = new Audio('./assets/collect.mp3');
    collect.volume = 0.4;
    var meow = new Audio('./assets/meow.mp3');
    meow.volume = 0.4;
    var click = new Audio('./assets/click.mp3');
    click.volume = 0.4;
    var fight = new Audio('./assets/fight.mp3');
    fight.volume = 0.1;

    ///////////////////////////////////////// MAP SETUP ////////////////////////////////////////////////////////

    // generate map
    var map = document.getElementById('map');
    var context = map.getContext('2d');

    context.beginPath();
    context.rect(0, 0, 600, 600);
    context.fillStyle = 'white';
    context.fill();

    class Matrix {
        constructor(rows, cols) {
            this.rows = rows;
            this.cols = cols;
            this.value = [];

            for (var i = 0; i < this.rows; i++) {
                this.value[i] = []; // fill each row with empty array
                for (var j = 0; j < this.cols; j++) {
                    this.value[i][j] = 0; // fill each column with intial value of zero
                }
            }
        }
        // function for filling each box with random number
        randomize() {
            for (var i = 0; i < this.rows; i++) {

                for (var j = 0; j < this.cols; j++) {
                    this.value[i][j] = Math.floor(Math.random() * Math.floor(5));
                }
            }
        }
    }

    var map = new Matrix(10, 10); // create map
    map.randomize(); // fill map with random values

    ///////////////////////////////////////// GLOBAL VARIABLES ////////////////////////////////////////////////////////

    var boxStatus; //declare box status variable 
    var boxSize = 60; // delcare size of box (width and height = 60 px)
    var key; // delcare variable for pressed key
    var blackBox; // delcare black box object
    var greyBox; // delcare grey box object
    var blackBoxes = []; //delare array for storing all black box objects
    var greyBoxes = []; //delare array for storing all grey box objects
    var moves = 0; // set move counter to zero
    var randomNumbers = []; // declare empty random Numbers array
    var randomNumber; // declare random Number variable
    var position = []; // declare empty array for player's position

    var timeToFight = false; // set time to fight to false
    var currentPlayer = 0; // set player 1 as current player
    var pendingPlayer = 1; // set player 2 as pending player
    var attackCount = 0; // set attack counter to zero

    var nextRight; // store matrix value for next possible right move in variable
    var nextLeft; // store matrix value for next possible left move in variable
    var nextUp; // store matrix value for next possible up move in variable
    var nextDown; // store matrix value for next possible down move in variable

    var imageCol; // delcare variables for storing old weapons new position
    var imageRow;
    var index; // declare index variable for old weapon 

    ///////////////////////////////////////// GAME SETUP ////////////////////////////////////////////////////////

    // class for boxes on map (blueprint for black box objects)
    class Box {
        constructor(row, col) {
            this.row = row;
            this.col = col;
        }

        createBox() {
            context.beginPath();
            context.rect(this.col * 60, this.row * 60, boxSize, boxSize);
        }
    }

    // fill map with grey and black boxes
    for (var row = 0; row < map.rows; row++) {

        for (var col = 0; col < map.cols; col++) {

            // if box status equals 4, place black box, set box value to 1 (unavailable)
            if (map.value[row][col] === 4) {

                blackBox = new Box(row, col);
                blackBox.createBox();
                context.fillStyle = 'black';
                context.fill();
                map.value[row][col] = 1;

                blackBoxes.push(blackBox); // push all black/unavaiable boxes onto blackBoxes array
            }
            //else place grey box, set box value to 0 (available)
            else {

                greyBox = new Box(row, col);
                greyBox.createBox();
                context.fillStyle = 'grey';
                context.fill();
                context.lineWidth = 1;
                context.strokeStyle = 'white';
                context.stroke();
                map.value[row][col] = 0;

                greyBoxes.push(greyBox); // push all grey/available boxes onto greyBoxes array
            }
        }
    }
    console.table(map.value);

    //fill random numbers array with random numbers equal to the length of grey Boxes array
    for (var i = 0; i < greyBoxes.length; i++) {
        randomNumbers.push(i);
    }

    // create item class
    class Item {
        constructor(image, damage, boxStatus, name) {

            this.image = image;
            this.damage = damage;
            this.boxStatus = boxStatus;
            this.name = name;
            getRandomNumber();
            this.row = position[0];
            this.col = position[1];
        }
        // show item on map
        show() {

            context.drawImage(this.image, this.col * 60, this.row * 60, boxSize, boxSize);
        }
        // clear item off current position
        clear() {

            context.beginPath();
            context.rect(this.col * 60, this.row * 60, boxSize, boxSize);
            context.fillStyle = 'grey';
            context.fill();
            context.lineWidth = 1;
            context.strokeStyle = 'white';
            context.stroke();
        }
    }

    // create child class player which extends the item class
    class Player extends Item {

        constructor(image, damage, boxStatus, name, health) {
            // call parent class constructor with shared properties between player and item
            super(image, damage, boxStatus, name);
            // add new properties health
            this.health = health;
            this.currentWeaponValue = 0;
            this.oldWeaponValue = 0;
        }

        // move player
        move(direction) {

            super.clear(); // call parent clear method
            jump.load();
            jump.play(); // play jump sound

            switch (direction) { // move player according to direction

                case 'right':
                    this.col = this.col + 1;
                    break;

                case 'left':
                    this.col = this.col - 1;
                    break;

                case 'up':
                    this.row = this.row - 1;
                    break;

                case 'down':
                    this.row = this.row + 1;
                    break;

                default:
                    break;
            }
            super.show(); // call parent show method 

        }
        dontMove() {
            this.row = this.row;
            this.col = this.col;
        }
        setValue(value) {
            map.value[this.row][this.col] = value; // set current field to desired value
        }


        pickUpWeapon() {
            this.currentWeaponValue = map.value[this.row][this.col]; // set player's current weapon value
            var weaponIndex = this.currentWeaponValue - 3; // store index for weapon in variable
            this.damage = this.currentWeaponValue * 5; // set player's damage to new weapon damage
            collect.play(); // play weapon collect sound
            placeWeaponImage(items.players[currentPlayer].currentWeaponValue);

            //play audio
            playAudioMessage(items.players[currentPlayer].name + ' has picked up a ' + items.weapons[weaponIndex].name + '. ' + items.players[currentPlayer].name + ' can cause ' + items.weapons[weaponIndex].damage + ' damage.');

        }

        exchangeWeapon() {
            //store current weapon value in old weapon valuevariable
            this.oldWeaponValue = this.currentWeaponValue
            // pick up new weapon
            items.players[currentPlayer].pickUpWeapon();

        }
        // check if players are next to each other
        static checkForFight(player1, player2) {
            if (
                (player1.row === player2.row && player1.col + 1 === player2.col)
                || (player1.row === player2.row && player1.col - 1 === player2.col)
                || (player1.row + 1 === player2.row && player1.col === player2.col)
                || (player1.row - 1 === player2.row && player1.col === player2.col)
            ) {
                timeToFight = true; // if yes, set variable to true

            }
        }

        static attack(player1, player2) {
            player2.health -= player1.damage; // substract current player's damage from pending player's health
            meow.play(); // play meow sound
            adjustHealthBar(player2.name, player2.health);

            //play audio
            playAudioMessage(player1.name + " attacks " + player2.name + '. ' + player2.name + " loses " + player1.damage + " health points.");
        }

        static defend(player1, player2) {
            player2.damage = player2.damage / 2; // divide pending player's damage by two

            // play audio
            playAudioMessage(player1.name + " defends himself against " + player2.name + "'s attack");
        }
        // if either player's health is zero or lower, run gameOver function, pass defeated player
        static checkHealth(player1, player2) {
            if (player1.health <= 0) {
                gameOver(player1, player2);
            }
            else if (player2.health <= 0) {
                gameOver(player2, player1);
            }
        }
    }

    ///////////////////////////////////////// LOAD WEAPONS & PLAYERS ////////////////////////////////////////////////////////

    // create new items and players instances
    var items = {

        players:
            [
                new Player(document.getElementById("player1"), 10, 2, 'Bob', 100),
                new Player(document.getElementById("player2"), 10, 2, 'Barry', 100)
            ],
        weapons:
            [
                new Item(document.getElementById("water"), 15, 3, 'water hose'),
                new Item(document.getElementById("lemon"), 20, 4, 'lemon'),
                new Item(document.getElementById("banana"), 25, 5, 'banana'),
                new Item(document.getElementById("vacuum"), 30, 6, 'vacuum cleaner')
            ]
    }

    ///////////////////////////////////////// GAMEPLAY ////////////////////////////////////////////////////////

    //show players and weapons
    for (var i = 0; i < items.players.length; i++) {
        items.players[i].show();
    }

    for (var i = 0; i < items.weapons.length; i++) {
        items.weapons[i].show();
    }

    updatePlayerValues(); // set values of player boxes to 2
    updateWeaponValues(); // set values of weapon boxes to weapon values
    speechSynthesis.speak(msg); // play welcoming message
    writeMessage();

    $("#Bob").addClass("border"); // put green border around current player

    // listen to current player's pressed key, store in key variable
    $(document).keydown(function (e) {

        if (e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40 || e.keyCode === 32) {
            e.preventDefault(); // prevent default scrolling 
        }

        // if player has moved less than three times
        if (moves < 3) {

            switch (e.keyCode) {

                case 39: // right
                    nextRight = map.value[items.players[currentPlayer].row][items.players[currentPlayer].col + 1];
                    if (nextRight === 0) { // if next box is empty
                        moveEmptyBox('right'); // run move in empty box function
                    }
                    if (nextRight > 2) { // if next box contains weapon
                        moveWeaponBox('right'); // run move in weapon box function
                    }
                    else if (nextRight != 0 && nextRight <= 2 || nextRight === undefined) {
                        items.players[currentPlayer].dontMove(); // if next box is not zero, or contains a player or is a black box or outside the matrix, don't move
                    }
                    break;

                case 37: // left
                    nextLeft = map.value[items.players[currentPlayer].row][items.players[currentPlayer].col - 1];
                    if (nextLeft === 0) {
                        moveEmptyBox('left');
                    }
                    if (nextLeft > 2) {
                        moveWeaponBox('left');
                    }
                    else if (nextLeft != 0 && nextLeft <= 2 || nextLeft === undefined) {
                        items.players[currentPlayer].dontMove();
                    }
                    break;

                case 38: // up
                    nextUp = map.value[items.players[currentPlayer].row - 1][items.players[currentPlayer].col];
                    if (nextUp === 0) {
                        moveEmptyBox('up');
                    }
                    if (nextUp > 2) {
                        moveWeaponBox('up');
                    }
                    else if (nextUp != 0 && nextUp <= 2 || nextUp === undefined) {
                        items.players[currentPlayer].dontMove();
                    }
                    break;

                case 40: // down 
                    nextDown = map.value[items.players[currentPlayer].row + 1][items.players[currentPlayer].col];
                    if (nextDown === 0) {
                        moveEmptyBox('down');
                    }
                    if (nextDown > 2) {
                        moveWeaponBox('down');
                    }
                    else if (nextDown != 0 && nextDown <= 2 || nextDown === undefined) {
                        items.players[currentPlayer].dontMove();
                    }
                    break;

                case 32: // spacebar

                    nextPlayer();
                    click.play();
                    playAudioMessage("Now it is " + items.players[currentPlayer].name + "'s turn.");
                    break;

                default:
                    break;
            }
            showMovesCounter();
            Player.checkForFight(items.players[currentPlayer], items.players[pendingPlayer]); // check for fight after each move
            console.table(map.value);
            console.log(items.players[currentPlayer]);
            console.log(attackCount);

        }
        else if (moves === 3 && e.keyCode === 32) { // if player has moved three times and presses space
            nextPlayer(); // next player's turn
            click.play(); // play click sound
            //play audio
            playAudioMessage("Now it is " + items.players[currentPlayer].name + "'s turn.");
        }

        if (timeToFight === true) { // if player's are next to each other

            if (attackCount <= 2) {

                if (attackCount === 0) {
                    fight.load(); // play bell once at beginning of match
                    fight.play();
                }

                else if (e.keyCode === 65) { // if player chooses to attack
                    // attack opponent
                    Player.attack(items.players[currentPlayer], items.players[pendingPlayer]);
                    nextPlayer(); // opponent's turn
                }

                else if (e.keyCode === 66) { // if player chooses to defend
                    Player.defend(items.players[currentPlayer], items.players[pendingPlayer]); // defend
                    nextPlayer();   // opponent's turn     
                }
                attackCount++;  // increment attack count
                Player.checkHealth(items.players[currentPlayer], items.players[pendingPlayer]); // check player's health after each move

            }

            else if (attackCount > 2) { // if both players have attacked/blocked each other once
                //play audio
                playAudioMessage("This round is over. Each player can now gather new weapons.");
                timeToFight = false; // set time to fight to false  
            }

        }
        else if (timeToFight === false && attackCount > 2) { // after fight, reset attack counter
            attackCount = 0;
        }
    });

    ///////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////////////////

    function nextPlayer() {
        switchImage(items.players[currentPlayer].name); // put green border around current player
        var temp = currentPlayer; // store 0 in temp variable
        currentPlayer = pendingPlayer; // set current player to 1
        pendingPlayer = temp; //set pending player to 0
        moves = 0; // reset moves counter  
    }

    function switchImage(player) {

        switch (player) {
            case 'Bob':
                $("#Bob").removeClass("border");
                $("#Barry").addClass("border");
                break;

            case 'Barry':
                $("#Barry").removeClass("border");
                $("#Bob").addClass("border");
                break;

            default:
                break;
        }
    }

    function placeWeaponImage(weapon) {

        if (items.players[currentPlayer].name === 'Bob') {
            switch (weapon) {
                case 3:
                    $("#p1Weapon").attr("src", "../assets/water.png");
                    break;

                case 4:
                    $("#p1Weapon").attr("src", "../assets/lemon.png");
                    break;

                case 5:
                    $("#p1Weapon").attr("src", "../assets/banana.png");
                    break;

                case 6:
                    $("#p1Weapon").attr("src", "../assets/vacuum.png");
                    break;

                default:
                    break;
            }
        }
        else if (items.players[currentPlayer].name === 'Barry') {
            switch (weapon) {
                case 3:
                    $("#p2Weapon").attr("src", "../assets/water.png");
                    break;

                case 4:
                    $("#p2Weapon").attr("src", "../assets/lemon.png");
                    break;

                case 5:
                    $("#p2Weapon").attr("src", "../assets/banana.png");
                    break;

                case 6:
                    $("#p2Weapon").attr("src", "../assets/vacuum.png");
                    break;

                default:
                    break;
            }
        }
    }

    function adjustHealthBar(player, playerHealth) {
        var health = playerHealth;
        switch (player) {
            case 'Bob':
                $("#p1Health").css('width', health + '%').attr('aria-valuenow', health).text(health + " Health Points");
                break;

            case 'Barry':
                $("#p2Health").css('width', health + '%').attr('aria-valuenow', health).text(health + " Health Points");
                break;

            default:
                break;
        }
    }

    function showMovesCounter() {
        $('#moves').text(moves);
    }

    function getRandomNumber() {

        // pick one random number from array, remove from array and return the same number
        var index = Math.floor(Math.random() * randomNumbers.length);
        randomNumber = randomNumbers.splice(index, 1);
        position = [greyBoxes[randomNumber].row, greyBoxes[randomNumber].col];
        return position;
    }


    function updatePlayerValues() {

        // get indexes of players update map value to player's box status
        for (var i = 0; i < items.players.length; i++) {
            map.value[items.players[i].row][items.players[i].col] = items.players[i].boxStatus;
        }
    }


    function updateWeaponValues() {
        // get indexes of weapons update map value to weapons's box status
        for (var i = 0; i < items.weapons.length; i++) {
            map.value[items.weapons[i].row][items.weapons[i].col] = items.weapons[i].boxStatus;
        }
    }

    function moveEmptyBox(direction) { // if player enters empty box
        if (items.players[currentPlayer].oldWeaponValue === 0) { // if player carries no previous weapon
            items.players[currentPlayer].setValue(0);   // set current box value to zero
            items.players[currentPlayer].move(direction); // move into empty box
            items.players[currentPlayer].setValue(2); // set new box to 2
        }
        else if (items.players[currentPlayer].oldWeaponValue > 0) { // if player has just exchanged his weapon
            items.players[currentPlayer].move(direction); // move into new box
            context.drawImage(items.weapons[index].image, imageCol * 60, imageRow * 60, boxSize, boxSize); // draw old weapon in previous box
            items.players[currentPlayer].setValue(2); // set current box to 2
            items.players[currentPlayer].oldWeaponValue = 0 // reset old weapon value to 0
        }
        moves++;
    }

    function moveWeaponBox(direction) { // if player enters weapon box
        if (items.players[currentPlayer].currentWeaponValue === 0) { // if player carries no previous weapon
            items.players[currentPlayer].setValue(0); // set current box to 0
            items.players[currentPlayer].move(direction); // move into weapon box
            items.players[currentPlayer].pickUpWeapon(); // pick up new weapon
            items.players[currentPlayer].setValue(2); // set current box to 2

        }
        else if (items.players[currentPlayer].currentWeaponValue > 0) { // if player carries previous weapon
            items.players[currentPlayer].setValue(0); // set current box to 0
            items.players[currentPlayer].move(direction); // move into new box
            items.players[currentPlayer].exchangeWeapon(); // exchange weapons
            index = items.players[currentPlayer].oldWeaponValue - 3; // store old weapons index
            imageCol = items.players[currentPlayer].col; // store old weapons col
            imageRow = items.players[currentPlayer].row; // store old weapons row
            items.players[currentPlayer].setValue(items.players[currentPlayer].oldWeaponValue); // set current box to old weapons value
        }
        moves++;
    }

    function gameOver(player1, player2) {
        $(document).off('keydown'); // remove event listener for moves/attack/block
        // play audio
        playAudioMessage(player1.name + " is defeated. " + player2.name + " wins. Game over.");

        var img = document.getElementById("gameover");
        context.drawImage(img, 0, 0, 600, 600);
    }

    ///////////////////////////////////////// AUDIO PLAYBACK & MESSAGE BOARD ////////////////////////////////////////////////////////
    function writeMessage() {
        var text = document.createElement("p"); // Create a <p> element
        text.textContent = msg.text; // Define its text content
        document.getElementById("msg").appendChild(text); // Insert the new element 
        document.getElementById('msg').scrollTop = text.offsetHeight + text.offsetTop;
    }

    document.getElementById('instruct').addEventListener('click', function (e) {
        msg.text = 'Move your character with the arrow keys. You can move up to three times. In this game various weapons are distributed throughout the map. Your current weapon are your claws. Pick up a new weapon by passing through it. Your claws cause 10 points damage, the water hose 15 points, the lemon 20 points, the banana 25 points and the vacuum cleaner 30 points. A fight starts when players cross over adjacent squares. Block your opponents attack by pressing the B-key. This will reduce the caused damage by half. You can attack by pressing the A-key.';
        writeMessage();
    });

    document.getElementById('clear').addEventListener('click', function (e) {
        document.getElementById('msg').innerHTML = "";
    });

    function playAudioMessage(message) {
        speechSynthesis.cancel(); // cancel all previous audio
        msg.text = message;
        speechSynthesis.speak(msg);
        writeMessage();
    }
});
