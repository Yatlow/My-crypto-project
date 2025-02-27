import { Coin } from "./build/Coin.js";
/// <reference path="jquery-3.7.1.js"/>
"use strict";

(() => {
    let loadingAnimationRef;
    let liveReportsRef;
    const followedCoins = new Set();
    const liveReportsData = new Map();

    //Event Listeners, Initilize context, fetch Data
    document.addEventListener("DOMContentLoaded", () => {
        fetchData();
        $("#menuBox").on("click", (event) => {
            clearInterval(liveReportsRef);
            const target = event.target.id;
            if (target === "homeBtn") {
                $("#mainBox").html("");
                followedCoins.clear();
                fetchData();
                scrollTo('.scrollImg-1');
            } else if (target === "liveReportsBtn") {
                $("#mainBox").html("");
                showLiveReports();
                scrollTo('#mainBox');
            } else if (target === "searchBtn") {
                const searchValue = $("#searchBox").val().trim();
                searchValue ? fetchData(searchValue) : showError("Search Box is empty, must enter a coin Name or Symbol ");
            } else if (target === "aboutBtn") {
                $("#mainBox").html(`
                    <div id="aboutBox">
                        <div>Built By Yisrael Atlow</div>
                        <div>Full-stack studies at John-Bryce college Ajax project</div>
                        <div>Feel free to email me at <a href="mailto:yisrael@atlow.co.il">yisrael@atlow.co.il</a></div>
                        <img src="assets/pictures/yatlow.jpg" class="myPhoto">
                    </div>
                `);
                scrollTo('#mainBox');
            }
        });
        window.addCoinToFollowedCoins = addCoinToFollowedCoins;
        window.toggleCoinFollow = toggleCoinFollow;
        window.saveChangesChooseFollowedCoins = saveChangesChooseFollowedCoins;
        window.showSpecificCoinBox = showSpecificCoinBox;
        window.closeSpecificCoinBox = closeSpecificCoinBox;
        window.closeChoose = closeChoose;
        window.chooseCoinToRemoveFromFollowList = chooseCoinToRemoveFromFollowList;
        window.renderCoins = renderCoins;
    });


    // UI functions
    function scrollTo(location) {
        if ($(location).length) {
            $('html, body').animate({
                scrollTop: $(location).offset().top
            }, 50);
        }
    };
    function loading() {
        $("#loadingDiv").css("position", "fixed");
        $("#loadingDiv").html(`
            <div  id="coinImg">
            <span> loading...</span>
            <img src="assets/pictures/coin.png">
            </div>
        `);
        $("#mainBox").addClass("lockClick");
        $("#mainBox").removeClass("allowClick");
        let position = 0;
        setTimeout(() => {
            loadingAnimationRef = setInterval(() => {
                position += 5;
                if (position > 900) position = 0;
                $("#coinImg").css("transform", `translate(${position}px, 0)`);
            }, 5);
        }, 5);
    };
    function stopLoading() {
        clearInterval(loadingAnimationRef);
        loadingAnimationRef = null;
        $("#loadingDiv").css("position", "absolute");
        $("#mainBox").removeClass("lockClick lockScroll");
        $("body").removeClass("lockScroll");
        $("#mainBox").addClass("allowClick");
        $("#loadingDiv").empty();
    };
    function showError(message) {
        stopLoading();
        $("#mainBox").html(`
            <div class="errorDiv">
                <div>
                    <div>Error loading data:</div>
                    <div>${message}</div>
                </div>
            </div>
        `);
        scrollTo('#mainBox');
    };


    //All Coins Data functions
    async function fetchData(dataSpecifications) {
        $("#searchBtn, #homeBtn, #liveReportsBtn").prop("disabled", true);
        loading();
        let cachedData = localStorage.getItem("allCoins");
        let jsonCoins;
        let dataToRender;
        if (cachedData) {
            try {
                jsonCoins = JSON.parse(cachedData);
                const now = new Date;
                const cachedTime = new Date(jsonCoins.timeStamp);
                const timeDifference = now - cachedTime;
                if (timeDifference > 120000) {
                    localStorage.removeItem("allCoins");
                    jsonCoins = null;
                } else {
                    dataToRender = dataSpecifications ? getCoinsBySearchKey(dataSpecifications) : jsonCoins.data;
                    renderCoins(dataToRender, 0);
                    $("#searchBox").val("");
                    return;
                }
            } catch (error) {
                console.error("Error parsing localStorage data:", error);
                jsonCoins = null;
                showError(error.message);
                return;
            } finally {
                $("#searchBtn, #homeBtn, #liveReportsBtn").prop("disabled", false);
            };
        };
        if (!jsonCoins) {
            try {
                const url = "https://api.coingecko.com/api/v3/coins/list";
                const response = await axios.get(url);
                const data = response.data;
                const timeStamp = new Date();
                jsonCoins = { timeStamp, data }
                localStorage.setItem("allCoins", JSON.stringify(jsonCoins))
                dataToRender = dataSpecifications ? getCoinsBySearchKey(dataSpecifications) : jsonCoins.data;
                renderCoins(dataToRender, 0);
            } catch (error) {
                console.error(error.message);
                showError(error.message);
            };
        };
        $("#searchBox").val("");
    };
    function getCoinsBySearchKey(searchKey) {
        const parsedCoins = JSON.parse(localStorage.getItem("allCoins"));
        const allCoins = parsedCoins.data;
        return allCoins.filter(coin => coin.id === searchKey || coin.name === searchKey || coin.symbol === searchKey)
    };


    //coin append and render
    async function renderCoins(coins, minCoinIndex) {
        $("#mainBox").html("");
        if (!coins) {
            coins = JSON.parse(localStorage.getItem("allCoins")).data;
            if (!coins.length) {
                stopLoading();
                throw new Error("No coins Available");
                ;
            }
        };
        const prevBtnText = minCoinIndex === 0 ? "" : `(${minCoinIndex - 200} - ${minCoinIndex})`;
        $("#mainBox").append(`
            <div id="coinsBoxBtnBox">
                <div>
                    <button id="minCoinNumBtn" onclick="renderCoins(null,${Math.max(minCoinIndex - 200, 0)})">
                        <<< previous ${prevBtnText}
                    </button>
                </div>
                <div id="coinDisplayDiv">displaying coins ${minCoinIndex} - ${minCoinIndex + 200} out of ${coins.length}</div>
                <div>
                    <button id="maxCoinNumBtn" ${minCoinIndex + 200 >= coins.length ? "disabled" : ""}
                        onclick="renderCoins(null,${minCoinIndex + 200})">
                        Next (${minCoinIndex + 200} - ${minCoinIndex + 400}) >>>
                    </button>
                </div>
            </div>
        `);
        $("#mainBox").append(`<div id="coinsBox"></div>`);

        const coinsToDisplay = coins.slice(minCoinIndex, minCoinIndex + 200);

        for (const coin of coinsToDisplay) {
            const coinInstance = new Coin(coin.id, coin.name, coin.symbol);
            const coinDiv = document.createElement("div");
            coinDiv.className = "coin";
            coinDiv.innerHTML = coinInstance.AppendCoin();
            $("#coinsBox").append(coinDiv);
        }

        const followedCoinsData = JSON.parse(localStorage.getItem("followedCoins"))
        if (followedCoinsData) {
            for (const coin of followedCoinsData) {
                addCoinToFollowedCoins(coin, false)
            }
        }
        stopLoading();
    };


    //Specific Coin Functions
    function addCoinToFollowedCoins(coinId, clicked) {
        if (followedCoins.has(coinId) && clicked) {
            followedCoins.delete(coinId);
            $(`#toggleInner_${coinId}`).css("background-color", "#434343")
            $(`#toggle_${coinId}`).css({
                "direction": "ltr",
                "background-color": "transparent"
            });
            localStorage.setItem("followedCoins", JSON.stringify([...followedCoins]));
            return;
        }
        if (followedCoins.size < 5) {
            $(`#toggleInner_${coinId}`).css("background-color", "#07025a")
            $(`#toggle_${coinId}`).css({
                "direction": "rtl",
                "background-color": "#f59c2f"
            });
            followedCoins.add(coinId);
        } else {
            if (!clicked) {
                return;
            }
            const choiceText = `In order to add <span class="extraName">${coinId}</span> to  your follow list, choose up to 5 coins.
        un-select coins in order to proceed, or cancel`;
            chooseCoinToRemoveFromFollowList(followedCoins, coinId, choiceText)
        }
        localStorage.setItem("followedCoins", JSON.stringify([...followedCoins]));
    };
    async function showSpecificCoinBox(coinId) {
        loading();
        try {
            const coinData = await fetchCoinData(coinId);
            if (coinData) {
                $("#showSpecificCoinBox").removeClass("hiddenSpecificCoinBox");
                $("#showSpecificCoinBox").html(`
                    <div><img src="${coinData.image.large}" class="specificCoinImg"></div>
                    <div>${coinData.name}</div>
                    <div>USD: ${coinData.market_data.current_price.usd} $</div>
                    <div>EUR: ${coinData.market_data.current_price.eur} €</div>
                    <div>ILS:  ${coinData.market_data.current_price.ils} ₪</div>
                    <div onclick="closeSpecificCoinBox()" id="closeSpecificCoinBox">close</div>
                    `)
                stopLoading();
                $("body").addClass("lockScroll");
            }
        } catch (error) {
            console.error(error.message);
            showError(error.message);
        }
    };
    function closeSpecificCoinBox() {
        $("#showSpecificCoinBox").addClass("hiddenSpecificCoinBox");
        $("body").removeClass("lockScroll");
        $("#mainBox").removeClass("lockScroll");
        $("#showSpecificCoinBox").html("");
        stopLoading()
    };
    async function fetchCoinData(coinId) {
        let cachedCoin = localStorage.getItem(`${coinId}`);
        let SpecificCoin;
        if (cachedCoin) {
            try {
                SpecificCoin = JSON.parse(cachedCoin);
                const now = new Date;
                const cachedTime = new Date(SpecificCoin.timeStamp);
                const timeDifference = now - cachedTime;
                if (timeDifference > 120000) {
                    localStorage.removeItem(`${coinId}`);
                    SpecificCoin = null;
                } else {
                    return SpecificCoin.data;
                }
            } catch (error) {
                console.error("Error parsing localStorage data:", error);
                SpecificCoin = null;
                showError(error.message);
                return;
            };
        };
        if (!SpecificCoin) {
            try {
                const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
                const response = await axios.get(url);
                const data = response.data;
                const timeStamp = new Date();
                SpecificCoin = { timeStamp, data }
                localStorage.setItem(`${coinId}`, JSON.stringify(SpecificCoin))
                return SpecificCoin.data;
            } catch (error) {
                console.error(error.message);
                showError(error.message);
            };
        };
    };


    //Follow List Functions
    function chooseCoinToRemoveFromFollowList(followedCoins, extraCoin, choiceText) {
        loading();
        $("#chooseCoinToStopFollowingBox").removeClass("hiddenChooseCoinToStopFollowingBox");
        $("body").addClass("lockScroll");
        const relevantCoins = {};
        const coinIds = Array.from(followedCoins)
        try {
            const allCoins = JSON.parse(localStorage.getItem("allCoins"));
            for (const coin of allCoins.data) {
                if (followedCoins.has(coin.id) || extraCoin === coin.id) {
                    relevantCoins[coin.id] = coin.name;
                }
            }
        } catch (error) {
            console.error(error.message);
            showError(error.message);
        };
        if (extraCoin) coinIds.push(extraCoin);
        localStorage.setItem("tempFollowedCoins", JSON.stringify(coinIds))
        let innerHTML = "";
        for (let i = 0; i < coinIds.length; i++) {
            innerHTML += `
            <div class="coinChoice">
                <div class="choiceName">${relevantCoins[coinIds[i]]}</div>
                <div class="toggleToFollow" id="choose${coinIds[i]}" onclick="toggleCoinFollow('${coinIds[i]}')">
                    <div id="chooseInner${coinIds[i]}" class="toggleToFollowInner"></div>
                </div>
            </div>
            `;
        };
        $("#chooseCoinToStopFollowingBox").html(`
        <div>${choiceText}</div>
        <div class="choiceBox">
            ${innerHTML}
        </div>
        <div class="chooseCoinApprovalBox">
            <span id="closeChoose" onclick="closeChoose()">cancel</span>
            <span id="saveChangesChoose" onclick="saveChangesChooseFollowedCoins()">save changes</span>
        </div>
        `);
        for (const coin of coinIds) {
            $(`#chooseInner${coin}`).css("background-color", "#f59c2f");
            $(`#choose${coin}`).css("direction", "rtl");
        }
        stopLoading();
    };
    function toggleCoinFollow(coinId) {
        const relevantCoins = JSON.parse(localStorage.getItem("tempFollowedCoins"));
        const deletedCoins = JSON.parse(localStorage.getItem("deletedCoins"));
        const relevantCoinsSet = new Set(relevantCoins);
        const deletedCoinsSet = new Set(deletedCoins);
        $(`#chooseInner${coinId}`).css("background-color", "#434343");
        $(`#choose${coinId}`).css("direction", "ltr");
        deletedCoinsSet.add(coinId);
        if (relevantCoinsSet.has(coinId)) {
            relevantCoinsSet.delete(coinId);
        } else {
            relevantCoinsSet.add(coinId)
            deletedCoinsSet.delete(coinId);
            $(`#chooseInner${coinId}`).css("background-color", "#f59c2f");
            $(`#choose${coinId}`).css("direction", "rtl");
        }
        if (relevantCoinsSet.size <= 5) {
            $("#saveChangesChoose").css("cursor", "pointer");
        } else {
            $("#saveChangesChoose").css("cursor", "not-allowed");
        }
        localStorage.setItem("deletedCoins", JSON.stringify(Array.from(deletedCoinsSet)));
        localStorage.setItem("tempFollowedCoins", JSON.stringify(Array.from(relevantCoinsSet)));
    };
    function saveChangesChooseFollowedCoins() {
        const newCoins = JSON.parse(localStorage.getItem("tempFollowedCoins"));
        const deletedCoins = JSON.parse(localStorage.getItem("deletedCoins"));
        if (newCoins.length > 5) return;
        localStorage.removeItem("deletedCoins");
        localStorage.removeItem("tempFollowedCoins");
        localStorage.setItem("followedCoins", JSON.stringify(newCoins));
        followedCoins.clear();
        for (const coin of deletedCoins) {
            followedCoins.add(coin);
            addCoinToFollowedCoins(coin, true);
        }
        for (const coin of newCoins) {
            addCoinToFollowedCoins(coin, false)
        }
        closeChoose();
    };
    function closeChoose() {
        localStorage.removeItem("deletedCoins");
        localStorage.removeItem("tempFollowedCoins");
        $("#chooseCoinToStopFollowingBox").empty();
        $('#chooseCoinToStopFollowingBox').addClass('hiddenChooseCoinToStopFollowingBox')
    };


    //Live reports functions (based on Follow List)
    function showLiveReports() {
        try {
            const choiceText = "Current Coins On Follow List:<br>toggle to add/remove or go to Home page to add new coins"
            loading();
            liveReportsData.clear();
            $("#mainBox").html(`
                <div id="ChangeFollowedCoinsFromLivePage">
                 Change Followed coins</div>
                 <div id="chartContainer" style="height: 345px; width: 100%;"></div>
                 <div id="invalidCoins"></div>
                 `);
            $("#ChangeFollowedCoinsFromLivePage").on("click", () => {
                chooseCoinToRemoveFromFollowList(followedCoins, '', choiceText);
            });
            let firstLoad = true;
            liveReportsRef = setInterval(async () => {
                const timeStamp = new Date();
                const allCoins = JSON.parse(localStorage.getItem("allCoins")).data;
                const filteredSymbols = Object.values(allCoins)
                    .filter(coin => followedCoins.has(coin.id))
                    .map(coin => coin.symbol.toUpperCase());
                const coinsString = filteredSymbols.join(',');
                if (!filteredSymbols.length) {
                    clearInterval(liveReportsRef);
                    showError("No coins are followed to display")
                }
                const coinData = await getLiveReportCoinData(coinsString);
                if (!coinData) {
                    clearInterval(liveReportsRef);
                    showError("failed to get coin data...");
                } else{
                    if (coinData.Response === "Error") {
                        clearInterval(liveReportsRef);
                        showError(`The Coins ${coinsString} do not exist in the API`);
                    }
                    else {
                        const followedCoinsSymbolArray=coinsString.split(",");
                        const validCoins=Object.keys(coinData);
                        const invalidCoins= followedCoinsSymbolArray.filter(coin=>!validCoins.includes(coin))
                        if (invalidCoins.length>0){
                            $("#invalidCoins").html(`
                            <div>
                            the following coin symbols from your follow list, do not exist in our API:
                            ${invalidCoins.join(",")}
                            </div>
                            `)
                        }
                    }

                };
                const liveCoinData = { timeStamp, coinData };
                RenderLiveReports(liveCoinData, firstLoad);
                if (firstLoad) {
                    stopLoading();
                    firstLoad = false;
                };
            }, 2000);
        } catch (error) {
            console.error(error);
            showError(error.message);
        }
    }
    function RenderLiveReports(liveCoinData, firstAppend) {
        const coins = liveCoinData.coinData;
        for (const [coin, data] of Object.entries(coins)) {
            if (data && data.USD) {
                const existingCoinData = liveReportsData.get(coin);
                if (existingCoinData) {
                    existingCoinData.dataPoints.push({
                        x: new Date(liveCoinData.timeStamp),
                        y: data.USD,
                    });
                } else {
                    liveReportsData.set(coin, {
                        type: "spline",
                        name: coin,
                        showInLegend: true,
                        xValueFormatString: "HH:MM",
                        yValueFormatString: "USD$",
                        dataPoints: [
                            { x: new Date(liveCoinData.timeStamp), y: data.USD },
                        ],
                    });
                }
            }
        }

        const displayArr = Array.from(liveReportsData.values());

        var options = {
            exportEnabled: true,
            animationEnabled: true,
            title: {
                text: "My Crypto Followed coins Live Reports"
            },
            subtitles: [{
                text: "Click Legend to Hide or Unhide Data Series"
            }],
            axisX: {
                title: "Crypto Coins"
            },
            axisY: {
                title: "$value in $",
                titleFontColor: "#4F81BC",
                lineColor: "#4F81BC",
                labelFontColor: "#4F81BC",
                tickColor: "#4F81BC"
            },
            toolTip: {
                shared: false
            },
            legend: {
                cursor: "pointer",
                itemclick: toggleDataSeries
            },
            data: displayArr,
        };
        if (firstAppend) {
            $("#chartContainer").CanvasJSChart(options);
        } else {
            $("#chartContainer").CanvasJSChart().render();
        }
        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }
    };
    async function getLiveReportCoinData(coinsString) {
        try {
            const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinsString}&tsyms=USD`;
            const liveCoinData = await axios.get(url);
            return liveCoinData.data;
        } catch (error) {
            console.error(error);
            showError(error.message);
        }
    }
})();