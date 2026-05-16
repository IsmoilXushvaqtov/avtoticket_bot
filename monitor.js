const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// 1. Bot Token va Chat ID ni shu yerga yozing
const token = '8823851415:AAGXmDtPcWtBT0BLzrTMhVDwwT0eSuloQNM';
const chatId = '6920365271';

const bot = new TelegramBot(token, { polling: false });
let lastNotificationTime = 0;

async function checkTickets() {
    try {
        // 2. 1 HAFTALIK TEKSHIRUV SOZLAMALARI
        const payloadData = {
            date: "2026-05-23", // Shu sanadan boshlab tekshirishni boshlaydi
            days: 7,            // 23-maydan boshlab 7 kunni (23, 24, 25, 26, 27, 28, 29-may) birdaniga tekshiradi
            from: 1726,         // Toshkent shahri ID si
            to: 1722210         // Surxondaryo viloyati ID si
        };

        const response = await axios.post('https://wapi.avtoticket.uz/api/api-trips', payloadData, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        if (!response.data || !response.data.data) return;

        const days = response.data.data;
        let foundTicketsMessage = "";

        // 7 kunlik barcha ma'lumotlarni aylanib chiqish
        for (const day of days) {
            if (day.trips && day.trips.length > 0) {
                for (const trip of day.trips) {
                    const routeName = trip.route_name_uz.toLowerCase();
                    
                    // Faqat Uzun va Denovga boradigan avtobuslarni ajratib olish
                    if (routeName.includes("uzun") || routeName.includes("denov")) {
                        const availableSeats = trip.seats - trip.sold_seats;

                        // Agar loaqal 1 ta joy bo'lsa ham xabar yozish
                        if (availableSeats > 0) {
                            const departureTime = trip.departure_at.split(' ')[1];
                            foundTicketsMessage += `\n🚌 **${day.name}** | ${trip.route_name_uz}\n⏰ Soat: ${departureTime} -> **${availableSeats} ta bo'sh joy bor!**\n`;
                        }
                    }
                }
            }
        }

        // Bilet topilsa, darhol Telegramga xabar berish
        if (foundTicketsMessage !== "") {
            const now = Date.now();
            if (now - lastNotificationTime > 3 * 60 * 1000) { 
                const finalMsg = `🎉 **DIQQAT! BILET SOTUVGA CHIQDI!**\n${foundTicketsMessage}\n🏃‍♂️ Zudlik bilan kirib sotib oling: https://avtoticket.uz/`;
                await bot.sendMessage(chatId, finalMsg, { parse_mode: 'Markdown' });
                lastNotificationTime = now;
            }
        }

    } catch (error) {
        console.log(`Xatolik yuz berdi: ${error.message}`);
    }
}

// Bot yonganda eslatma
bot.sendMessage(chatId, "✅ **Avtoticket Monitoring (1 Haftalik rejim) muvaffaqiyatli ishga tushdi!**\n\nEndi bot 23-maydan 29-maygacha bo'lgan barcha Uzun va Denov reyslarini har daqiqada tekshirib boradi.", { parse_mode: 'Markdown' });

// Har 1 daqiqada tekshirish
setInterval(checkTickets, 60 * 1000);
checkTickets();

// Har 1 soatda Bot ishlab turgani haqida hisobot
setInterval(async () => {
    try {
        const time = new Date().toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent' });
        const statusMsg = `🤖 **Bot Holati Eslatmasi:**\n🟢 Server 24/7 rejimda faol.\n🔄 1 haftalik biletlar har daqiqada tekshirilmoqda.\n⏰ Oxirgi tekshiruv vaqti: ${time}`;
        await bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error("Status xatosi:", err.message);
    }
}, 60 * 60 * 1000);

// Render serveri uchun
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot 1 haftalik rejimda ishlamoqda...\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server ${PORT}-portda yoqildi.`);
});
