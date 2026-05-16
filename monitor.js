const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const token = '8823851415:AAGXmDtPcWtBT0BLzrTMhVDwwT0eSuloQNM';
const chatId = '6920365271';
const bot = new TelegramBot(token, { polling: false });

async function checkTickets() {
    try {
        const payloadData = {
            date: "2026-05-24", // 24-maydan boshlaymiz
            days: 4,            // 24, 25, 26, 27-may kunlarini olamiz
            from: 1726,
            to: 1722210
        };

        const response = await axios.post('https://wapi.avtoticket.uz/api/api-trips', payloadData, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Origin': 'https://avtoticket.uz',
                'Referer': 'https://avtoticket.uz/',
                'Accept-Language': 'uz,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive'
            },
            timeout: 15000
        });

        const days = response.data?.data;
        let foundTicketsMessage = "";

        if (days) {
            for (const day of days) {
                if (day.trips && day.trips.length > 0) {
                    for (const trip of day.trips) {
                        const routeName = trip.route_name_uz.toLowerCase();
                        if (routeName.includes("uzun") || routeName.includes("denov")) {
                            const availableSeats = trip.seats - trip.sold_seats;
                            if (availableSeats > 0) {
                                const departureTime = trip.departure_at.split(' ')[1].substring(0, 5);
                                foundTicketsMessage += `\n🚌 **${day.name}** | ${trip.route_name_uz} \n⏰ Soat: ${departureTime} -> **${availableSeats} ta joy bor!**\n`;
                            }
                        }
                    }
                }
            }
        }

        const timeNow = new Date().toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent' });

        if (foundTicketsMessage !== "") {
            await bot.sendMessage(chatId, `✅ **BILET TOPILDI! (${timeNow})**\n${foundTicketsMessage}\n🏃‍♂️ Sayt: https://avtoticket.uz/`, { parse_mode: 'Markdown' });
        } else {
            console.log(`[${timeNow}] Bilet yo'q.`);
        }

    } catch (error) {
        // Agar xatolik bersa, Telegramni to'ldirib tashlamaslik uchun faqat logga yozamiz
        const timeNow = new Date().toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent' });
        console.error(`[${timeNow}] Xatolik: ${error.message}`);
    }
}

// BOTNI HAR 5 DAQIQADA ISHLATAMIZ (BLOKKA TUSHMASLIK UCHUN!)
setInterval(checkTickets, 5 * 60 * 1000);

// Ishga tushganda birinchi marta 10 soniyadan keyin tekshiradi
setTimeout(checkTickets, 10000);

// Render serveri uchun
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot ishlamoqda\n');
});
server.listen(process.env.PORT || 3000, () => {
    console.log("Server portda ishga tushdi!");
});
