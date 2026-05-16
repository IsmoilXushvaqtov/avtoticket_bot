const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// 1. Bot Token va Chat ID ni shu yerga yozing
const token = '8823851415:AAGXmDtPcWtBT0BLzrTMhVDwwT0eSuloQNM';
const chatId = '6920365271';

// 2. API manzili va kerakli sanalar
const apiUrl = 'https://wapi.avtoticket.uz/api/api-trips?from=1726&to=1722210'; 
const targetDates = ["2026-05-25", "2026-05-26", "2026-05-27"];

const bot = new TelegramBot(token, { polling: false });
let lastNotificationTime = 0;

// 3. Asosiy tekshirish funksiyasi
async function checkTickets() {
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json, text/plain, */*'
            },
            timeout: 15000
        });
        
        if (!response.data || !response.data.data) return;
        const days = response.data.data;
        let foundTicketsMessage = "";

        for (const day of days) {
            if (targetDates.includes(day.name)) {
                // Yangi reys qo'shilganini tekshirish
                if (day.name === "2026-05-26" && day.count > 2) {
                    foundTicketsMessage += `\n➕ **2026-05-26** sanasiga yangi avtobus qo'shildi!`;
                } else if ((day.name === "2026-05-25" || day.name === "2026-05-27") && day.count > 0) {
                    foundTicketsMessage += `\n➕ **${day.name}** sanasiga reys ochildi!`;
                }

                // Bo'sh joylarni tekshirish
                if (day.trips && day.trips.length > 0) {
                    for (const trip of day.trips) {
                        const routeName = trip.route_name_uz.toLowerCase();
                        if (routeName.includes("uzun") || routeName.includes("denov")) {
                            const availableSeats = trip.seats - trip.sold_seats;

                            if (availableSeats > 0) {
                                const departureTime = trip.departure_at.split(' ')[1];
                                foundTicketsMessage += `\n🚌 **${day.name}** | ${trip.route_name_uz}\n⏰ Soat: ${departureTime} -> **${availableSeats} ta joy bor!**\n`;
                            }
                        }
                    }
                }
            }
        }

        // Bilet topilsa, xabar yuborish
        if (foundTicketsMessage !== "") {
            const now = Date.now();
            if (now - lastNotificationTime > 3 * 60 * 1000) { 
                const finalMsg = `🎉 **DIQQAT! SOTUVDA BILET BOR!**\n${foundTicketsMessage}\n🏃‍♂️ Kirib sotib oling: https://avtoticket.uz/`;
                await bot.sendMessage(chatId, finalMsg, { parse_mode: 'Markdown' });
                lastNotificationTime = now;
            }
        }
    } catch (error) {
        console.log(`Xatolik yuz berdi: ${error.message}`);
    }
}

// Har 1 daqiqada tekshirish
setInterval(checkTickets, 60 * 1000);
checkTickets();

// 4. Har 1 soatda Bot ishlashi haqida hisobot
setInterval(async () => {
    try {
        const time = new Date().toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent' });
        const statusMsg = `🤖 **Bot Holati Eslatmasi:**\n🟢 Server 24/7 rejimda faol.\n🔄 Avtoticket sayti har daqiqada tekshirilmoqda.\n⏰ Oxirgi tekshiruv vaqti: ${time}\n\nXavotir olmang, bot ishlayapti!`;
        await bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error("Status yuborishda xatolik:", err.message);
    }
}, 60 * 60 * 1000);

// 5. Render serveri o'chib qolmasligi uchun yordamchi kod
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot ishlamoqda...\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server ${PORT}-portda yoqildi.`);
});
