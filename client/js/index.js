const sock = io();

var loginName;


const promptLogin = () => {
  const pinNumber = prompt("Please enter pin number:");
  sock.emit('checkUser', pinNumber);
};
promptLogin();

//-----------------------------------------------------------------------------------------------------------
let binTriggered = false;

var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf("android") > -1;

const container = document.getElementById("container");

const button = document.getElementById("add");
const restart = document.getElementById("restart");

if (isAndroid) { document.body.style.touchAction = "none" };

restart.addEventListener('click', () =>{
  if (loginName == "teacher") {
    if (confirm('Confirm restart?')) {
      // Save it!
      sock.emit('clearAndShuffle');
    } else {
      // Do nothing!
      alert("Action cancelled.")
    }
  }
});

button.addEventListener('click', (e) => {
  // e.preventDefault();
  if (loginName == "teacher") {
    sock.emit('createNewCards');
  }

});

// const glass = document.getElementById("glass");
// glass.addEventListener('mousedown', mouseDown);

function createCardDivElement(obj) {

  const ele = document.createElement("div");
  ele.innerHTML = obj.letter;
  ele.classList = obj.classList;
  ele.id = obj.id;
  container.appendChild(ele);
  ele.style.top = obj.cardLastPositionY + 'px';
  ele.addEventListener('mousedown', mouseDown);
  ele.addEventListener('touchstart', touchStart);
}

function createGlassDiv(obj) {
  const glass = document.createElement("div");
  glass.id = obj.glassId;
  glass.classList = "glass";
  container.appendChild(glass);
  glass.style.top = '60px';
  glass.addEventListener('mousedown', mouseDown);
};

function appendInsideToGlass(obj) {

  const glassDiv = document.getElementById(obj.glassId);
  const glassCovers = glassDiv.getElementsByClassName("glassCover");

  if (glassCovers.length != 0) {
    const glassCover = glassDiv.getElementsByClassName("glassCover");
    glassCover[0].parentNode.removeChild(glassCover[0]);
  };

  obj.nameStr.forEach(letter => {
    const inside = document.createElement("div");
    inside.innerHTML = letter;
    inside.classList = "inside";
    glassDiv.appendChild(inside);
  });

  const glassCover = document.createElement("div");
  glassCover.classList = "glassCover";
  glassCover.id = obj.glassId;
  glassCover.addEventListener('mousedown', mouseDown);
  glassDiv.appendChild(glassCover);
  
};


function mouseDown(e) {

  if(loginName!=="teacher") {return};
  // console.log("mouse down" + e.target.id);

  startX = e.clientX
  startY = e.clientY
  const divId = e.target.id;

  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('mouseup', mouseUp)

  sock.emit('clientMouseDown', { startX, startY, divId });
}
function touchStart(e) {
  // e.preventdefault();
  // document.body.style.touchAction = "none";
  startX = e.targetTouches[0].pageX;
  startY = e.targetTouches[0].pageY;
  const divId = e.target.id;

  document.addEventListener('touchmove', touchMove);
  document.addEventListener('touchend', touchEnd);

  sock.emit('clientMouseDown', { startX, startY, divId });
}


function mouseMove(e) {
  newX = startX - e.clientX
  newY = startY - e.clientY

  startX = e.clientX
  startY = e.clientY

  // console.log('id:' + e.target.id + ', x:' + e.clientX + ', y:' + e.clientY );

  const wasteBin = document.getElementById("bin");
  if (e.clientX > 1200 && e.clientY > 40) {
    wasteBin.classList.add("highlight");
    binTriggered = true;
  } else {
    wasteBin.classList.remove("highlight");
    binTriggered = false;
  }

  sock.emit('clientMouseMove', { startX, startY, newX, newY });

}
function touchMove(e) {

  newX = startX - e.targetTouches[0].pageX;
  newY = startY - e.targetTouches[0].pageY;


  startX = e.targetTouches[0].pageX;
  startY = e.targetTouches[0].pageY;

  const wasteBin = document.getElementById("bin");
  if (e.targetTouches[0].pageX > 1200 && e.targetTouches[0].pageY > 40) {
    wasteBin.classList.add("highlight");
    binTriggered = true;
  } else {
    wasteBin.classList.remove("highlight");
    binTriggered = false;
  }

  sock.emit('clientMouseMove', { startX, startY, newX, newY });

}

function mouseUp(e) {
  document.removeEventListener('mousemove', mouseMove)

  const divId = e.target.id;

  const card = document.getElementById(divId);
  const cardLastPositionY = card.offsetTop;
  const cardLastPositionX = card.offsetLeft;

  if (binTriggered) {
    const wasteBin = document.getElementById("bin");
    card.remove();
    wasteBin.classList.remove("highlight");
    binTriggered = false;
    sock.emit('removeDom', divId);
    return;
  }

  sock.emit('clientMouseUp', { cardLastPositionX, cardLastPositionY, divId });

}
function touchEnd(e) {
  // document.body.style.touchAction = "unset";
  document.removeEventListener('touchmove', touchMove)

  const divId = e.target.id;

  const card = document.getElementById(divId);
  const cardLastPositionY = card.offsetTop;
  const cardLastPositionX = card.offsetLeft;

  if (binTriggered) {
    const wasteBin = document.getElementById("bin");
    card.remove();
    wasteBin.classList.remove("highlight");
    binTriggered = false;
    sock.emit('removeDom', divId);
    return;
  }

  sock.emit('clientMouseUp', { cardLastPositionX, cardLastPositionY, divId });
}



sock.on('response', (data) => {
  loginName = data;
  const refreshButton = document.getElementById("refresh");
  if (loginName == "teacher") {
    refreshButton.style.visibility = "visible";
  }
  refreshButton.addEventListener('click', ()=>{
    sock.emit('sendRefresh');
  });
});

sock.on('updateAllClients', (data) => {

  const card = document.getElementById(data.divId);

  card.style.top = (card.offsetTop - data.newY) + 'px'
  card.style.left = (card.offsetLeft - data.newX) + 'px'

});

sock.on('renderGlassAndInsides', (ELEMENT_LIST) => {

  ELEMENT_LIST.forEach(element => {
    
    if (document.getElementById(element.glassId) != null) { return };

    createGlassDiv(element);
    appendInsideToGlass(element);
    const domGlass = document.getElementById(element.glassId);
    domGlass.style.top = (element.cardLastPositionY) + 'px';
    domGlass.style.left = (element.cardLastPositionX) + 'px';
    

    // if (document.getElementById(element.glassId) == null) {
       
      
      
    // } else if(document.getElementById(element.glassId) != null) {
    //   const glassDiv = document.getElementById(element.glassId);
    //   const nodesArr = Array.prototype.slice.call(glassDiv.getElementsByTagName("*"),0);
      
    // };
    
    // domGlass.style.top = (card.cardLastPositionY) + 'px';
    // domGlass.style.left = (card.cardLastPositionX) + 'px';
  });

  
  

  
});
sock.on('renderGlassAndInsides2', (ELEMENT_LIST) => {

  ELEMENT_LIST.forEach(element => {
    
    // if (document.getElementById(element.id) != null) { return };
    var nodeExist = false;

    if (document.getElementById(element.glassId) == null) {
      createGlassDiv(element); 
      appendInsideToGlass(element);
      const domGlass = document.getElementById(element.glassId);
      domGlass.style.top = '120px';
      domGlass.style.left = '120px';
    } else if(document.getElementById(element.glassId) != null) {
      const glassDiv = document.getElementById(element.glassId);
      const nodesArr = Array.prototype.slice.call(glassDiv.getElementsByTagName("*"),0);
      nodesArr.forEach(item => {
        if (item.innerHTML == element.letter) {
          nodeExist = true;
        };
      });
      if (nodeExist == false) {
        appendInsideToGlass(element);
      };
      
    };
    
    // domGlass.style.top = (card.cardLastPositionY) + 'px';
    // domGlass.style.left = (card.cardLastPositionX) + 'px';
  });

  
  

  
});



sock.on('updateAllClientsWhenRefreshed', (data) => {

  data.forEach(card => {
    if (document.getElementById(element.glassId) != null) { return };
    createGlassDiv(card);
    appendInsideToGlass(card);
    const domCard = document.getElementById(card.glassId);
    domCard.style.top = (card.cardLastPositionY) + 'px';
    domCard.style.left = (card.cardLastPositionX) + 'px';
  });
});

sock.on('updateButton', data => {
  button.innerHTML = data;
});

sock.on('removeDomOnOtherClient', data => {
  const card = document.getElementById(data);
  if (card == null) return;
  card.remove();
});

sock.on('ifNeedRefresh', (data) => {
  if (data != loginName) {
    alert("refresh")
    window.location.reload();
  }
});



// window.setTimeout(function () {
//   if (loginName !== "teacher") {
//     window.location.reload();
//   }
  
// }, 5000);

