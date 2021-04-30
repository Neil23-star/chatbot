window.SpeechRecognition =
  window.webkitSpeechRecognition || window.SpeechRecognition;

let recognition = new window.SpeechRecognition();
recognition.maxAlternatives = 10;
recognition.interimResults = true;
recognition.continuous = true;
recognition.lang = "vi-VN";

let finalText = "";

recognition.onresult = function(event) {
  finalText = event.results[event.resultIndex][0].transcript;
  chatInput.value = finalText;
};

recognition.onstart = function() {
  console.log("Voice recognition activated. Try speaking into the microphone.");
  chatInput.value = "";
  finalText = "";
};

recognition.onend = function() {
    console.log("STOP: " + finalText);
    let userResponse = removeVietnameseTones(chatInput.value.trim());
    if (userResponse !== "") {
        setUserResponse()
        send(userResponse)
    }
};

function startListen() {
  recognition.start();
}

function stopListen() {
  recognition.stop();
}

/*
Makes backend API call to rasa chatbot and display output to chatbot frontend
*/
function init() {

    //---------------------------- Including Jquery ------------------------------

    var script = document.createElement('script');
    script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js';
    script.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(script);

    //--------------------------- Important Variables----------------------------
    botLogoPath = "/static/imgs/bot-logo.png"

    //--------------------------- Chatbot Frontend -------------------------------
    const chatContainer = document.getElementById("chat-container");

    template = ` <button class='chat-btn'><img src = "/static/icons/comment.png" class = "icon" ></button>

    <div class='chat-popup'>
    
		<div class='chat-header'>
			<div class='chatbot-img'>
				<img src='${botLogoPath}' alt='Chat Bot image' class='bot-img'> 
			</div>
			<h3 class='bot-title'>Chat Bot</h3>
			<button class = "expand-chat-window" ><img src="/static/icons/open_fullscreen.png" class="icon" ></button>
		</div>

		<div class='chat-area'>
            <div class='bot-msg'>
                <img class='bot-img' src ='${botLogoPath}' />
				<span class='msg'>Hi, How can i help you?</span>
			</div>
		</div>


		<div class='chat-input-area'>
			<input type='text' autofocus class='chat-input' onkeypress='return givenUserInput(event)' placeholder='Moi ban nhap cau hoi tu van ...' autocomplete='off'> 
			<button class='chat-voice'><i class='material-icons'>mic</i></button>
			<button class='chat-submit'><i class='material-icons'>send</i></button>
		</div>

	</div>`


    chatContainer.innerHTML = template;

    //--------------------------- Important Variables----------------------------
    var inactiveMessage = "Mất kết nối máy chủ  Rasa"


    chatPopup = document.querySelector(".chat-popup")
    chatBtn = document.querySelector(".chat-btn")
    chatVoice = document.querySelector(".chat-voice")
    chatSubmit = document.querySelector(".chat-submit")
    chatHeader = document.querySelector(".chat-header")
    chatArea = document.querySelector(".chat-area")
    chatInput = document.querySelector(".chat-input")
    expandWindow = document.querySelector(".expand-chat-window")
    root = document.documentElement;
    chatPopup.style.display = "none"
    var host = ""


    //------------------------ ChatBot Toggler -------------------------

    chatBtn.addEventListener("click", () => {

        mobileDevice = !detectMob()
        if (chatPopup.style.display == "none" && mobileDevice) {
            chatPopup.style.display = "flex"
            chatInput.focus();
            chatBtn.innerHTML = `<img src = "/static/icons/close.png" class = "icon" >`
        } else if (mobileDevice) {
            chatPopup.style.display = "none"
            chatBtn.innerHTML = `<img src = "/static/icons/comment.png" class = "icon" >`
        } else {
            mobileView()
        }
    })

    chatSubmit.addEventListener("click", () => {
        let userResponse = removeVietnameseTones(chatInput.value.trim());
        if (userResponse !== "") {
            setUserResponse();
            send(userResponse)
        }
    })

    chatVoice.addEventListener("click", () => {
        responsiveVoice.pause();
        if (chatInput.disabled) {
            // recording -> stop
            stopListen();
            chatInput.disabled = false;
            chatSubmit.disabled = false;
            chatSubmit.style.backgroundColor = "#21D4FD";
        } else {
            // start recording
            startListen();
            chatInput.disabled = true;
            chatSubmit.disabled = true;
            chatSubmit.style.backgroundColor = "#999a9e";
        }
    })

    expandWindow.addEventListener("click", (e) => {
        // console.log(expandWindow.innerHTML)
        if (expandWindow.innerHTML == '<img src="/static/icons/open_fullscreen.png" class="icon">') {
            expandWindow.innerHTML = `<img src = "/static/icons/close_fullscreen.png" class = 'icon'>`
            root.style.setProperty('--chat-window-height', 80 + "%");
            root.style.setProperty('--chat-window-total-width', 85 + "%");
        } else if (expandWindow.innerHTML == '<img src="./icons/close.png" class="icon">') {
            chatPopup.style.display = "none"
            chatBtn.style.display = "block"
        } else {
            expandWindow.innerHTML = `<img src = "/static/icons/open_fullscreen.png" class = "icon" >`
            root.style.setProperty('--chat-window-height', 500 + "px");
            root.style.setProperty('--chat-window-total-width', 380 + "px");
        }

    })


}


function userResponseBtn(e) {
    send(e.value);
}

// to submit user input when he presses enter
function givenUserInput(e) {
    if (e.keyCode == 13) {
        let userResponse = removeVietnameseTones(chatInput.value.trim());
        if (userResponse !== "") {
            setUserResponse()
            send(userResponse)
        }
    }
}

// to display user message on UI
function setUserResponse() {
    let userInput = chatInput.value;
    if (userInput) {
        let temp = `<div class="user-msg"><span class = "msg">${userInput}</span></div>`
        chatArea.innerHTML += temp;
        chatInput.value = "";
    } else {
        chatInput.disabled = false;
    }
    scrollToBottomOfResults();
}


function scrollToBottomOfResults() {
    chatArea.scrollTop = 999999;
}

/***************************************************************
 Frontend Part Completed
 ****************************************************************/

// host = 'http://localhost:5005/webhooks/rest/webhook'
function send(message) {
    chatInput.focus();
    console.log("User Message:", message)
    $.ajax({
        url: host,
        type: 'POST',
        contentType: 'application/json',
        headers: {'Access-Control-Allow-Origin': 'http://The web site allowed to access'},
        data: JSON.stringify({
            message: message,
            sender: "User",
        }),
        success: function (data, textStatus) {
            if (data != null) {
                setBotResponse(data);
            }
            console.log("Rasa Response: ", data, "\n Status:", textStatus)
        },
        error: function (errorMessage) {
            setBotResponse("");
            console.log('Error' + errorMessage);

        }
    });
    chatInput.focus();
}

// Text to speech
function speak(text) {
    if(text.includes("<table>")) {
        text = 'Đây là danh sách 5 ngành điểm cao nhất bạn có thể đỗ';
        responsiveVoice.speak(text, "Vietnamese Female");
    } else {
        responsiveVoice.speak(text, "Vietnamese Female");
    }
}

//------------------------------------ Set bot response -------------------------------------
function setBotResponse(val) {
    responsiveVoice.pause();
    setTimeout(function () {
        if (val.length < 1) {
            //if there is no response from Rasa
            // msg = 'I couldn\'t get that. Let\' try something else!';
            msg = inactiveMessage;

            var BotResponse = `<div class='bot-msg'><img class='bot-img' src ='${botLogoPath}' /><span class='msg'> ${msg} </span></div>`;

            $(BotResponse).appendTo('.chat-area').hide().fadeIn(1000);
            scrollToBottomOfResults();
            chatInput.focus();

            // Speak msg
            console.log("Speak: " + msg);
            speak(msg);

        } else {
            //if we get response from Rasa
            for (i = 0; i < val.length; i++) {
                //check if there is text message
                if (val[i].hasOwnProperty("text")) {
                    var BotResponse = `<div class='bot-msg'><img class='bot-img' src ='${botLogoPath}' /><span class='msg'>${val[i].text}</span></div>`;

                    $(BotResponse).appendTo('.chat-area').hide().fadeIn(1000);

                    // Speak
                    console.log("Speak : " + val[i].text);
                    speak(val[i].text);
                }

                //check if there is image
                if (val[i].hasOwnProperty("image")) {
                    var BotResponse = "<div class='bot-msg'>" +
                        '<img class="msg-image" src="' + val[i].image + '">' +
                        '</div>'
                    $(BotResponse).appendTo('.chat-area').hide().fadeIn(1000);
                }

                //check if there are buttons
                if (val[i].hasOwnProperty("buttons")) {
                    var BotResponse = `<div class='bot-msg'><img class='bot-img' src ='${botLogoPath}' /><div class='response-btns'>`

                    buttonsArray = val[i].buttons;
                    buttonsArray.forEach(btn => {
                        BotResponse += `<button class='btn-primary' onclick= 'userResponseBtn(this)' value='${btn.payload}'>${btn.title}</button>`
                    })

                    BotResponse += "</div></div>"

                    $(BotResponse).appendTo('.chat-area').hide().fadeIn(1000);
                    chatInput.disabled = true;
                }

            }
            scrollToBottomOfResults();
            chatInput.disabled = false;
            chatInput.focus();
        }

    }, 1000);
}


function mobileView() {
    $('.chat-popup').width($(window).width());

    if (chatPopup.style.display == "none") {
        chatPopup.style.display = "flex"
        // chatInput.focus();
        chatBtn.style.display = "none"
        chatPopup.style.bottom = "0"
        chatPopup.style.right = "0"
        // chatPopup.style.transition = "none"
        expandWindow.innerHTML = `<img src = "/static/icons/close.png" class = "icon" >`
    }
}

function detectMob() {
    return ((window.innerHeight <= 800) && (window.innerWidth <= 600));
}

function chatbotTheme(theme) {
    const gradientHeader = document.querySelector(".chat-header");
    const orange = {
        color: "#FBAB7E",
        background: "linear-gradient(19deg, #FBAB7E 0%, #F7CE68 100%)"
    }

    const blue = {
        color: "#21D4FD",
        background: "linear-gradient(19deg, #B721FF 0%, #21D4FD 100%)"
    }


    if (theme === "orange") {
        root.style.setProperty('--chat-window-color-theme', orange.color);
        gradientHeader.style.backgroundImage = orange.background;
        chatSubmit.style.backgroundColor = orange.color;
        chatVoice.style.backgroundColor = orange.color;
    } else if (theme === "blue") {
        root.style.setProperty('--chat-window-color-theme', blue.color);
        gradientHeader.style.backgroundImage = blue.background;
        chatSubmit.style.backgroundColor = blue.color;
        chatVoice.style.backgroundColor = blue.color;
    }
}

function createChatBot(hostURL, botLogo, title, welcomeMessage, inactiveMsg, theme = "blue") {

    host = hostURL;
    botLogoPath = botLogo;
    inactiveMessage = inactiveMsg;
    init()
    const msg = document.querySelector(".msg");
    msg.innerText = welcomeMessage;

    const botTitle = document.querySelector(".bot-title");
    botTitle.innerText = title;

    chatbotTheme(theme)
}
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    // Bỏ các khoảng trắng liền nhau
    str = str.replace(/ + /g, " ");
    str = str.trim();
    // Remove punctuations
    // Bỏ dấu câu, kí tự đặc biệt
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    return str;
}