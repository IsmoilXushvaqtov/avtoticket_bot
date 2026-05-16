const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// Bot Token va Chat ID ni almashtiring
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
            date: getTodayDate(), // Bugungi sanadan boshlab
            days: 7,              // Kelayotgan 1 haftani tekshiradi
            from: 1726,
            to: 990005008         // Kolomna (Moskva) - TEST
        };

        const response = await axios.post('https://wapi.avtoticket.uz/api/api-trips', payloadData, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const days = response.data.data;
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

        // Natijaga qarab har daqiqada xabar yuborish
        if (foundTicketsMessage !== "") {
            await bot.sendMessage(chatId, `✅ **BILET TOPILDI!**${foundTicketsMessage}`, { parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(chatId, `❌ Hozircha kelayotgan 1 hafta ichida bilet yo'q.`);
        }

    } catch (error) {
        console.log(`Xatolik: ${error.message}`);
    }
}

// Skriptni har 60 soniyada ishga tushirish
setInterval(checkTickets, 60 * 1000);
checkTickets();

// Render uchun server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot ishlamoqda\n');
});
server.listen(process.env.PORT || 3000);
