let blacklist = []
let isRunning = true
let socket = null
let timeoutId = null

// Функция для подключения к серверу
function connectToWebSocket() {
    if(socket) {
        socket.close()
        socket=null
    }

    socket = new WebSocket(`ws://localhost:8081`)
    console.log(`Попытка подключения`)

    socket.addEventListener(`open`, (event)=>{
        console.log(`WebSocket подключен`)
        isRunning=true
        startTabCheckInterval(1000)
    })

    socket.addEventListener(`message`,(event)=>{
        try {
            const data = JSON.parse(event.data)
            if(data.type===`update_blacklist`){
                console.log(`Получено сообщение с запрещенными доменами:`+data.urls)
                blacklist=data.urls
                checkAllTabs()
            }
        }catch(error){
            console.error(`Ошибка парсинга JSON:`, error)
        }
    })

    socket.addEventListener(`close`,(event)=>{
        console.log(`Соединение закрыто. Код: ${event.code}, Причина: ${event.reason}`)
        blacklist=[]
        stopTabCheckInterval()
        setTimeout(connectToWebSocket,3000)
    })

    socket.addEventListener('error', (error) => {
        console.error('Ошибка WebSocket:', error)
    })
}

// Функция для проверки всех вкладок
function checkAllTabs(){
    if(!isRunning) return

    chrome.tabs.query({},(tabs)=>{
        tabs.forEach(tab=>{
            if(tab.url && blacklist.some(url=>tab.url.includes(url))){
                console.log(`Закрытие вкладки с запрещенным URL: ${tab.url}`)
                chrome.tabs.remove(tab.id)
            }
        })
    })
}

// Функция для запуска проверки вкладок по интервалу
function startTabCheckInterval(delay){
    if(!isRunning) return
    console.log(`Проверка`)
    checkAllTabs()

    timeoutId=setTimeout(()=>{
       startTabCheckInterval(delay) 
    },delay)
}

// Функция для остановки проверки вкладок по интервалу
function stopTabCheckInterval(){
    clearTimeout(timeoutId)
    timeoutId=null
    isRunning=false
    console.log(`Проверка вкладок остановлена`)
}

connectToWebSocket()