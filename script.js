window.onload = gameplay;

function gameplay () {
    this.playerBattlefield = document.getElementById('battlefield-player');
    this.compBattlefield = document.getElementById('battlefield-comp');
    this.gamearea = document.getElementById('gamearea');
    this.count = [10,10];
    this.computerFireDirection = null;
    
    let gameStatus = document.getElementById('game-status');
    let gameCount = document.getElementById('game-count');
    let fleet = [4,3,3,2,2,2,1,1,1,1];
    let computerNextShot;

    let startGame = () => {
        this.gamearea.classList.add('game-started');
        gameStatus.innerHTML = 'Battle started!';
        initAim();
        initShotgun();
    }
    let finishGame = (winner) => {
        this.gamearea.classList.remove('game-started');
        this.gameFinished = true;
        gameStatus.innerHTML = `Game over. ${winner}!`;
        this.compBattlefield.removeEventListener("mousemove", moveAim);
        setTimeout(() => delete this.aim, 350);
    }

    let initShotgun = () => {
        this.computerAim = document.createElement('figure');
        this.computerAim.className = 'aim';
        
        let onShot = (e, comp) => {
            if (this.gameFinished)
                return; 

            let target;
            if (comp) {
                targetIndex = computerNextShot != undefined && computerNextShot != false ? computerNextShot : parseInt(Math.random()*100);
                if (this.lastShot == targetIndex) targetIndex = parseInt(Math.random()*100);
                this.lastShot = targetIndex;
                target = playerBattlefield.querySelector(`.battlefield__cell:nth-child(${targetIndex+1})`);
                if (target.classList.contains('damaged') || target.classList.contains('shooted') || target.classList.contains('comp-area-around')) {
                    setTimeout(() => onShot(null, true), 10);
                    return;
                }
                computerNextShot = undefined;
            } else 
                target = e.target;
            
            if (target.classList.contains('shooted'))
                return;

            if (target.classList.contains('ship-placed')) {
                if (comp) { // Имитируем выстрел компьютера
                    target.append(this.computerAim);
                    setTimeout(() => {
                        this.computerAim.classList.add('visible');
                        this.computerAim.classList.add('transition-3', 'bang');
                        setTimeout(() => { 
                            this.computerAim.classList.remove('transition-3', 'bang'); 
                            this.computerAim.classList.remove('visible'); 
                        },300);
                    },10)
                } else {
                    this.aim.classList.add('transition-3', 'bang');
                    setTimeout(()=>{ this.aim.classList.remove('transition-3', 'bang'); },300);
                }

                target.classList.add('damaged');
                let destoyedShip = checkIsShipWasDestroyed(target, comp ? 'comp' : 'player');
                
                if (destoyedShip != null) {
                    destoyedShip.classList.add('destoyed');
                    if (comp) {
                        this.count[0]--; // Минус очко игроку
                        delete this.lastSuccessShot;
                        computerNextShot = undefined;
                    } else
                        this.count[1]--; // Минус очко компьютеру
                    gameCount.innerHTML = `${this.count[1]} : ${this.count[0]}`;
                    if (this.count[0] == 0) finishGame('Computer won');
                    else if (this.count[1] == 0) finishGame('You won');
                } else if (comp) {
                    this.lastSuccessShot = targetIndex;
                    planNextShot();
                }
            } else {
                target.classList.add('shooted');
                if (comp)
                    planNextShot();
            }
            
            if (!comp)
                setTimeout(() => onShot(null, true), 10);
        }
        this.compBattlefield.addEventListener("click", onShot);

        let planNextShot = () => {
            let that = this;
            if (this.lastSuccessShot == undefined)
                return;
            
            if (that.computerFireDirection === null)
                that.computerFireDirection = parseInt(Math.random()*10) > 4 ? true : false;
            fire(that.computerFireDirection);
            

            function fire () {
                let size = that.computerFireDirection ? 10 : 1;
                let direction = (Math.round(Math.random()) ? 1 : -1); 
                let distance = size * direction;

                target = setTarget(that.lastSuccessShot + distance);
                
                if (checkMiss(target)) { // Проверяем промахи
                    target = setTarget(that.lastSuccessShot - distance);
                    if (checkMiss(target)) {
                        if (!checkDamageAfterMiss()) {
                            that.computerFireDirection = !that.computerFireDirection;
                            fire();
                        }
                    } else {
                        computerNextShot = checkDamageAfterMiss() ? checkDamageAfterMiss() : that.lastSuccessShot - distance;
                    }

                    function checkDamageAfterMiss () { // Проверяем попадания на всем протяжении корабля
                        if (checkDamage(target)) {
                            for (let i = 0; i < 5; i++) {
                                target = setTarget(that.lastSuccessShot - distance+i);
                                if (!checkDamage(target)) {
                                    target = setTarget(that.lastSuccessShot - distance+i);
                                    return target;
                                }
                            }
                            return false;
                        }
                        else
                            return false;
                    }

                } else if (checkDamage(target)) { // Проверяем попадания
                    let count = 0;
                    while (computerNextShot == undefined || count > 10) {
                        if (that.lastSuccessShot - distance > -1 && that.lastSuccessShot + distance < 100)
                            target = setTarget(that.lastSuccessShot - distance);    
                        else 
                            target = setTarget(that.lastSuccessShot + distance);    
                        let alreadyShooted = checkDamage(target) || checkMiss(target);
                        if (alreadyShooted) {
                            distance = distance + size * (-direction);
                        }
                        else {
                            computerNextShot = that.lastSuccessShot - distance;
                        }
                        count++;
                    }
                    if (checkDamage(target)) {
                        // Если с двух сторон от цели уже были выстрелы
                        target = setTarget(that.lastSuccessShot + distance*2);
                        if (checkDamage(target)) {
                            target = setTarget(that.lastSuccessShot - distance*2);
                        }
                    }
                } else 
                    computerNextShot = that.lastSuccessShot + distance;
            }
            function setTarget (targetIndex) {
                return playerBattlefield.querySelector(`.battlefield__cell:nth-child(${targetIndex+1})`);
            }
            function checkDamage (target) {
                if (target)
                    return target.classList.contains('damaged')
                else return true;
            }
            function checkMiss (target) {
                if (target)
                    return target.classList.contains('shooted')
                else return true;
            }
        }

    }

    
    let checkIsShipWasDestroyed = (target, shotAuthor) => {
        let battlefield = shotAuthor == 'player' ? this.compBattlefield : this.playerBattlefield;
        let vertical = target.classList.contains('vertical');
        let elIndex = getElementIndex(target) + 1;
        let size, shipNode, startCellIndex;
        if (target.children[0] && target.children[0].classList.contains('ship')) {
            shipNode = target.children[0];
            size = checkTargetSize(shipNode);
            if (size == 1) {
                paintItBlack(elIndex);
                return shipNode;
            } else startCellIndex = elIndex;
        }

        if (!shipNode) {
            if (vertical) {
                let search = 0;
                do { // Смотрим повреждения на всём протяжении корабля
                    let cell = battlefield.querySelector(`.battlefield__cell:nth-child(${elIndex-search})`);
                    if (cell.children[0] && cell.children[0].classList.contains('ship')) {
                        startCellIndex = elIndex-search;
                        shipNode = cell.children[0];
                    }
                    search+=10;
                } while (!shipNode);
            } else {
                let search = 1;
                do {
                    let cell = battlefield.querySelector(`.battlefield__cell:nth-child(${elIndex-search})`);
                    if (cell.children[0] && cell.children[0].classList.contains('ship')) {
                        startCellIndex = elIndex-search;
                        shipNode = cell.children[0];
                    }
                    search++;
                } while (!shipNode);
            }
        }
        size = checkTargetSize(shipNode);
        for (let i = startCellIndex; i < startCellIndex + (vertical ? size*10 : size) ; i += vertical ? 10 : 1) {
            if (!battlefield.querySelector(`.battlefield__cell:nth-child(${i})`).classList.contains('damaged'))
                return null;
        }

        if (shotAuthor == 'comp' && shipNode) {
            paintItBlack(startCellIndex);
        }
        return shipNode;

        function paintItBlack (startCellIndex) { // Определяем ячейки рядом с уничтоженным кораблём, чтобы туда не стрелять
            let areaAround = [];
            let startInfo = startCellIndex%10;
            let startPaintFrom = startInfo == 1 ? ((startCellIndex - 10) < 0 ? startCellIndex-1 : (startCellIndex - 10)) : startCellIndex - 11;
            if (shipNode.classList.contains('vertical')) {
                for (let n = startPaintFrom; n < startCellIndex + size*10 + (startInfo == 0 ? 1 : 2);) {
                    let cellNode = battlefield.querySelector(`.battlefield__cell:nth-child(${n})`);
                    if (cellNode && !cellNode.classList.contains('ship-placed')) 
                        cellNode.classList.add('comp-area-around');
                    if (startInfo == 0 && n%10 == 0) 
                        n += 9;
                    else if (startCellIndex%10 != 0 && n%10 > startCellIndex%10) {
                        if (startInfo == 1) n += 9; else n += 8;
                    }
                    else if (n%10 == 0 && startCellIndex%10 >= 8)
                        n += 8;
                    else n++;
                }
            } else {
                for (let n = startPaintFrom; n < startCellIndex + 11 + size;) {
                    let cellNode = battlefield.querySelector(`.battlefield__cell:nth-child(${n})`);
                    if (cellNode && !cellNode.classList.contains('ship-placed')) 
                        cellNode.classList.add('comp-area-around');
                    if (n%10 == 0 && (startCellIndex+size-1)%10 == 0) 
                        n += 10-size;
                    else if (n%10 == 0 && startCellIndex+size%10 >= 8)
                        n += 9-size;
                    else if ((startCellIndex+size-1)%10 != 0 && n%10 > (startCellIndex+size-1)%10) {
                        if (startInfo == 1) n += 10-size; else n += 9-size;
                    }
                    else n++;
                }
            }
        }

        function checkTargetSize (shipNode) {
            return shipNode.classList.contains('shipsize_1') ? 1 : shipNode.classList.contains('shipsize_2') ? 2 : shipNode.classList.contains('shipsize_3') ? 3 : 4;
        }
    }

    let initAim = () => {  // Устанавливаем прицел
        this.compBattlefield.addEventListener("mousemove", moveAim);
        this.aim = document.createElement('figure');
        this.aim.className = 'aim';
        this.compBattlefield.appendChild(this.aim);
    }
    let moveAim = (e) => {
        let pos = this.compBattlefield.getBoundingClientRect();
        this.aim.style.top = e.clientY - 25;
        this.aim.style.left = e.clientX - 25;
    }

    let initSeaBattle = () => { // Запуск игры
        let battlefields = document.getElementsByClassName('battlefield');
        battlefields.forEach = Array.prototype.forEach;
        battlefields.forEach(battlefield => { // Наполняем поле ячейками
            for(let i = 0; i < 100; i++) {
                let field = document.createElement('field');
                field.className = `battlefield__cell column_${i%10} line_${Math.floor(i/10)}`;
                battlefield.appendChild(field)
            }
        });

        let firstCell = this.playerBattlefield.querySelector('.battlefield__cell');

        let shipsOrder = 0;
        let compShipsOrder = 0;

        chooseShipPlace(fleet[shipsOrder]); // Пользователь расставляет свои корабли
        chooseShipPlace(fleet[compShipsOrder], true); // Быстренько расставляем корабли компьютера
        
        function chooseShipPlace(shipSize, comp) {
            let battlefield = comp ? this.compBattlefield : this.playerBattlefield;
            let ship = document.createElement('figure');
            ship.className = `ship shipsize_${shipSize} vertical shadow`;
            if (comp && parseInt(Math.random()*10) > 4)
                ship.classList.remove('vertical');
            let newCell;
            let newCellIndex;

            if (comp) {
                newCellIndex = parseInt(Math.random()*100);
                if (checkShipPosition(ship, newCellIndex)) {
                    newCell = battlefield.querySelector(`.battlefield__cell:nth-child(${newCellIndex+1})`);
                    newCell.appendChild(ship);
                    compShipsOrder++;
                    fixShip();
                } else {
                    delete ship;
                    setTimeout(function () {
                        chooseShipPlace(fleet[compShipsOrder], true);
                    }, 10)
                    return;
                }
            } else {
                shipsOrder++;
                firstCell.appendChild(ship);
                battlefield.addEventListener("mouseover", moveShip)
                battlefield.addEventListener("click", fixShip);
                document.addEventListener("keydown", rotateShip);
            }


            function rotateShip (e) {
                e.preventDefault();
                if (e.keyCode === 9) 
                    if (!checkDirectionIsHorizontal(ship)) ship.classList.remove('vertical');
                    else ship.classList.add('vertical');
            }
            function moveShip (e) {
                newCell = e.toElement;
                if (newCell.classList.contains('ship'))
                    newCell = newCell.parentNode;
                newCellIndex = getElementIndex(newCell);
                if (checkShipPosition(ship, newCellIndex))
                    newCell.appendChild(ship);
            }
            function fixShip () {
                if (!comp) {
                    battlefield.removeEventListener("mouseover", moveShip);
                    battlefield.removeEventListener("click", fixShip);
                    document.removeEventListener("keydown", rotateShip);
                }
                ship.classList.remove("shadow");
                
                paintShipCells(ship, newCellIndex);

                if (fleet[comp ? compShipsOrder : shipsOrder]) // Запускаем постановку нового корабля
                    chooseShipPlace(fleet[comp ? compShipsOrder : shipsOrder], comp ? true : false);
                else if (!comp) // Больше нет кораблей? Тогда начинаем играть.
                    startGame();


                delete ship;
            }
            function checkShipPosition(ship, newCellIndex) {
                // Смотрим положение ячейки и проверяем, не выходит ли за пределы поля
                if (checkDirectionIsHorizontal(ship)) index = newCellIndex%10;
                else index =  Math.floor(newCellIndex/10);
                if (index + shipSize > 10)
                    return false;
                
                if (checkDirectionIsHorizontal(ship)) {
                    for (let i = newCellIndex; i < newCellIndex + shipSize; i++) {
                        let cell = battlefield.querySelector(`.battlefield__cell:nth-child(${i+1})`);
                        if (cell && (cell.classList.contains('ship-placed') || cell.classList.contains('ship-around'))) return false;
                    }
                } else {
                    for (let i = newCellIndex; i < newCellIndex + (shipSize-1)*10 + 1; i += 10) {
                        let cell = battlefield.querySelector(`.battlefield__cell:nth-child(${i+1})`);
                        if (cell && (cell.classList.contains('ship-placed') || cell.classList.contains('ship-around'))) return false;
                    }
                }
                return true;
            } 
            // Ставим классы на ячейки, где находится корабль, чтобы не было возможности ставить корабли рядом
            function paintShipCells (ship, newCellIndex) {
                var start = Math.floor(newCellIndex/10-1)*10;
                if (start < 0) start = 0;
                if(checkDirectionIsHorizontal(ship)) {
                    let mincol = (newCellIndex%10)-2;
                    let maxcol = (newCellIndex+shipSize)%10 > 0 ? ((newCellIndex+shipSize)%10)+1 : 10;
                    let lastCell = newCellIndex+shipSize+12;
                    for (let i = start; i < 100; i++) {
                        if (i > newCellIndex-12 && i < lastCell && i%10 > mincol && i%10 < maxcol) {
                            if (i >= newCellIndex && i < newCellIndex + shipSize) {
                                let cell = battlefield.querySelector(`.battlefield__cell:nth-child(${i+1})`);
                                cell.classList.add('ship-placed', 'horizontal');
                            } else {
                                let cell = battlefield.querySelector(`.battlefield__cell:nth-child(${i+1})`);
                                cell.classList.add('ship-around');
                            }
                        } else if (i > lastCell) {
                            break;
                        }
                    }
                } else {
                    let lastCell = newCellIndex+(shipSize*10)+2;
                    for (let i = start; i < 100; i++) {
                        if(i > newCellIndex-12 && i < lastCell && (i%10 == newCellIndex%10 || i%10 == (newCellIndex%10)+1 || i%10 == (newCellIndex%10)-1)) {
                            if (i > newCellIndex-1 && i < newCellIndex+(shipSize*10)-1 && i%10 == newCellIndex%10) {
                                let cell = battlefield.querySelector(`.battlefield__cell:nth-child(${i+1})`);
                                cell.classList.add('ship-placed', 'vertical');
                            } else {
                                let cell = battlefield.querySelector(`.battlefield__cell:nth-child(${i+1})`);
                                cell.classList.add('ship-around');
                            }
                        } else if (i >= lastCell) {
                            break;
                        }
                    }
                }
            }

        }
    }

    function checkDirectionIsHorizontal(ship) {
        if (!ship.classList.contains('vertical')) return true;
        else return false;
    }
    function getElementIndex(elem) {
        elem = elem.tagName ? elem : document.querySelector(elem)
        return [].indexOf.call(elem.parentNode.children, elem)
    }
    initSeaBattle();
}