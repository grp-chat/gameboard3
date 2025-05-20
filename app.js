const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { join } = require('path');
const { json } = require('express');
const fs = require('fs');
const PORT = process.env.PORT || 3000;

const app = express();

const clientPath = `${__dirname}/client`;
console.log(`Serving static files from path ${clientPath}`);

app.use(express.static(clientPath));
const server = http.createServer(app);
const io = socketio(server);

server.listen(PORT);
console.log("Server listening at " + PORT);

//====================================================================================================
// const Card = require('./card');
const CHARACTER_SET = require('./character_set');
const TAG_SET = require('./tag_set');


let isTeacher = false;

function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}


let TAG_SET2 = [];






const packSize = 8;

let charecter_setIndex = 0;
let tag_SetIndex = 0;

let charactersRemaining2 = CHARACTER_SET.length - charecter_setIndex;





let newX = 0, newY = 0, startX = 0, startY = 0, divId = 0;

let ELEMENT_LIST = [];
let charactersRemaining = TAG_SET.length - ELEMENT_LIST.length;


fs.readFile('savegame.txt', function (err, data) {
    if (err) throw err;
    ELEMENT_LIST = JSON.parse(data);
});
fs.readFile('shuffled.txt', function (err, data) {
    if (err) throw err;
    TAG_SET2 = JSON.parse(data);
});




let position = 30;
let runningNumber = 1;
let glassRunningNumber = 10000;


class Card {
    constructor(letter) {
        this.letter = letter;
        this.element = "div";
        this.classList = "card";
        this.cardLastPositionX = position;
        this.cardLastPositionY = 60;
        this.id = runningNumber;
        position += 60;
        runningNumber++;
        ELEMENT_LIST.push(this);
    }
};

class Tag {
    constructor(nameStr) {
        this.element = "div";
        this.classList = "glass";
        this.cardLastPositionX = position;
        this.cardLastPositionY = 60;
        this.glassId = glassRunningNumber;
        this.nameStr = nameStr
        glassRunningNumber++;
        position += 100;
        ELEMENT_LIST.push(this);
        
        
    }
};

class Inside {
    constructor(letter) {
        this.letter = letter;
        this.element = "div";
        this.classList = "inside";
        this.glassId = glassRunningNumber;
        this.cardLastPositionX = position;
        this.cardLastPositionY = 60;
        position += 60;
        ELEMENT_LIST.push(this);
    }
};

function freshPack() {

    position = 60;
    const PACK = [];
    if (charecter_setIndex > CHARACTER_SET.length) { charecter_setIndex = 0 };
    for (let i = 0; i < packSize; i++) {
        if (CHARACTER_SET[charecter_setIndex] == undefined) { charecter_setIndex = 0 };
        PACK.push(CHARACTER_SET[charecter_setIndex]);
        charecter_setIndex++;
    }

    return PACK.map(alphabets => {
        const card = new Card(alphabets);
        return card;
    });

}

function freshPack2() {

    if (tag_SetIndex >= TAG_SET.length) { tag_SetIndex = 0 };

    position = 30;
    const startingIndex = tag_SetIndex;
    
    TAG_SET2.forEach((tag, index) => {

        if (index != tag_SetIndex) {return;}
        const count = tag_SetIndex - startingIndex;
        if(count > packSize) {return}

        tag_SetIndex++;

        return new Tag(tag);
    });
    
}
function freshPack3() {

    position = 60;
    TAG_SET.forEach(tag => {
        glassRunningNumber++;
        

        const PACK = tag;
        return PACK.map(alphabets => {
            const card = new Inside(alphabets);
            return card;
        });
    });
}

class Pack {
    constructor(cards = freshPack2()) {
        this.cards = cards;
    };
}


io.sockets.on('connection', (sock) => {

    
    charactersRemaining = TAG_SET.length - ELEMENT_LIST.length;
    glassRunningNumber = ELEMENT_LIST.length;
    tag_SetIndex = ELEMENT_LIST.length;
    // io.emit('updateAllClientsWhenRefreshed', ELEMENT_LIST);
    io.emit('renderGlassAndInsides', ELEMENT_LIST);
    io.emit('updateButton', charactersRemaining);

    sock.on('checkUser', (data) => {
        if (data == 8) {
            const user = "teacher";
            sock.emit('response', user);
        };
    });

    sock.on('clientMouseDown', (data) => {
        startX = data.startX;
        startY = data.startY;
        divId = data.divId;
    });

    sock.on('clientMouseMove', (data) => {
        startX = data.startX;
        startY = data.startY;
        newX = data.newX;
        newY = data.newY;


        io.emit('updateAllClients', { newX, newY, startX, startY, divId }); //dont remove divId, its from mousedown
    });

    sock.on('clientMouseUp', (data) => {


        ELEMENT_LIST.forEach(element => {

            if (element.glassId === parseInt(data.divId)) {
                element.cardLastPositionX = data.cardLastPositionX;
                element.cardLastPositionY = data.cardLastPositionY;
            }
        });

        // fs.writeFile('setIndex.txt', setIndex, err => {
        //     if (err) {
        //         console.err;
        //         return;
        //     }
        // });
        const saveGame = JSON.stringify(ELEMENT_LIST);
        fs.writeFile('savegame.txt', saveGame, err => {
            if (err) {
                console.err;
                return;
            }
        });


        

        
    });

    sock.on('createNewCards', () => {

        const pack = new Pack();
        // io.emit('updateAllClientsWhenRefreshed', ELEMENT_LIST);
        io.emit('renderGlassAndInsides', ELEMENT_LIST);


        charactersRemaining = TAG_SET.length - ELEMENT_LIST.length;
        
        io.emit('updateButton', charactersRemaining);
    });

    sock.on('removeDom', data => {
        ELEMENT_LIST.forEach((item, index, object) => {
            if (item.glassId == data) {
                object.splice(index, 1);
            };
        });
        const divId = data;
        io.emit('removeDomOnOtherClient', divId);
    });

    sock.on('sendRefresh', ()=>{
        const loginName = "teacher"
        io.emit('ifNeedRefresh', loginName);
    });

    sock.on('clearAndShuffle', () => {
        ELEMENT_LIST.splice(0, ELEMENT_LIST.length)
        const clearGame = JSON.stringify(ELEMENT_LIST);
        fs.writeFile('savegame.txt', clearGame, err => {
            if (err) {
                console.err;
                return;
            }
        });

        shuffle(TAG_SET);

        const shuffled = JSON.stringify(TAG_SET);
        fs.writeFile('shuffled.txt', shuffled, err => {
            if (err) {
                console.err;
            return;
            }
        });



    });

    // sock.on("test", data => { console.log(data) });


});