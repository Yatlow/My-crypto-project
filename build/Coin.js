export class Coin {
    id;
    name;
    symbol;
    constructor(id, name, symbol) {
        this.id = id;
        this.name = name;
        this.symbol = symbol;
    }
    appendCoin() {
        return `
        <div class="toggleBox">
        <span>add to follow list</span>
                <div class="toggleToFollow" id="toggle_${this.id}" onclick="addCoinToFollowedCoins('${this.id}',true)">
                <div id="toggleInner_${this.id}" class="toggleToFollowInner"></div>
            </div>
        </div>
        <div class="coinDynamicInfoDiv">id: <span>${this.id}</span></div>
        <div class="coinDynamicInfoDiv">name: <span>${this.name}</span></div>
        <div class="coinDynamicInfoDiv">symbol: <span>${this.symbol}</span></div>
        <div class="coinBtn" onclick="showSpecificCoinBox('${this.id}')">more info</div>
    `;
    }
    ;
}
