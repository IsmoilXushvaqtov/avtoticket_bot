const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// Sizning ma'lumotlaringiz to'g'ridan-to'g'ri kodga joylandi:
const token = '8823851415:AAGXmDtPcWtBT0BLzrTMhVDwwT0eSuloQNM';
const chatId = '6920365271';

const bot = new TelegramBot(token, { polling: false });

// Bugungi sanani olish (Y-M-D formatida)
const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

async function checkTickets() {
    try {
        const payloadData = {
            date: getTodayDate(),
            days: 7,
            from: 1726,
            to: 990005008 
        };

        const response = await axios.post('https://wapi.avtoticket.uz/api/api-trips', payloadData, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Origin': 'https://avtoticket.uz',
                'Referer': 'https://avtoticket.uz/'
            },
            timeout: 10000
        });

        const days = response.data?.data;
        let foundTicketsMessage = "";

        if (days) {
            for (const day of days) {
                if (day.trips && day.trips.length > 0) {
                    for (const trip of day.trips) {
                        const availableSeats = trip.seats - trip.sold_seats;
                        if (availableSeats > 0) {
                            foundTicketsMessage += `\n🚌 ${day.name} | ${trip.route_name_uz} -> **${availableSeats} ta joy bor!**`;
                        }
                    }
                }
            }
        }

        if (foundTicketsMessage !== "") {
            await bot.sendMessage(chatId, `✅ **BILET TOPILDI!**${foundTicketsMessage}`, { parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(chatId, `❌ Hozircha kelayotgan 1 hafta ichida bilet yo'q.`);
        }

    } catch (error) {
        console.error("Xatolik xulosasi:", error.message);
        // Agar yana 405 yoki boshqa xatolik bo'lsa, Telegramga qizil belgi va xatolik sababini yuboramiz
        await bot.sendMessage(chatId, `❌ Sayt bilan ulanishda xatolik: ${error.message}`);
    }
}

setInterval(checkTickets, 60 * 1000);
checkTickets();

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot ishlamoqda\n');
});
server.listen(process.env.PORT || 3000, () => {
    console.log("Server portda ishga tushdi!");
});
