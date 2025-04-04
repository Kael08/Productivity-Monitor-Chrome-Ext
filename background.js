let blacklist = [];
let intervalId = null; // Для хранения ID интервала

// Функция для проверки всех вкладок
function checkAllTabs(tabs) {
    tabs.forEach(tab => {
        if (tab.url && blacklist.some(url => tab.url.includes(url))) {
            console.log(`❌ Закрываю вкладку с URL: ${tab.url}`);
            chrome.tabs.remove(tab.id);
        }
    });
}

// Запуск проверки вкладок по интервалу
function startTabCheckInterval() {
    if (intervalId) {
        clearInterval(intervalId); // Очищаем предыдущий интервал, если был
    }
    intervalId = setInterval(() => {
        chrome.tabs.query({}, checkAllTabs);
    }, 5000);
    console.log("🔃 Интервал проверки вкладок запущен (5 сек)");
}

// Функция подключения к WebSocket-серверу
function connectToWebSocket() {
    const socket = new WebSocket('ws://localhost:8081');

    socket.onopen = () => {
        console.log("✅ WebSocket подключён");
        startTabCheckInterval(); // Запускаем интервал после подключения
    };

    socket.onmessage = (event) => {
        console.log("📥 Получено сообщение:", event.data);
        const data = JSON.parse(event.data);
        if (data.type === 'update_blacklist') {
            blacklist = data.urls;
            chrome.tabs.query({}, checkAllTabs); // Проверяем все вкладки сразу
        }
    };

    socket.onerror = (e) => {
        console.error("⚠️ WebSocket ошибка", e);
    };

    socket.onclose = () => {
        console.log("⚠️ WebSocket соединение закрыто");
        if (intervalId) {
            clearInterval(intervalId); // Останавливаем интервал при разрыве соединения
        }
    };
}

connectToWebSocket();