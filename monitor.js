const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// Sizning Telegram Bot Token va Chat ID (hech narsani o'zgartirmang)
const token = '8823851415:AAGXmDtPcWtBT0BLzrTMhVDwwT0eSuloQNM';
const chatId = '6920365271';

const bot = new TelegramBot(token, { polling: false });

async function checkTickets() {
    try {
        // Aniq siz xohlagan sanalar va yo'nalishlar (24-maydan boshlab 4 kun)
        const payloadData = {
            date: "2026-05-24", // 24-maydan boshlaymiz
            days: 4,            // 24, 25, 26, 27-may kunlarini olamiz
            from: 1726,         // Toshkent shahri
            to: 1722210         // Surxondaryo viloyati
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

        // Ma'lumotlarni saralash (Faqat Uzun va Denovni qidiramiz)
        if (days) {
            for (const day of days) {
                if (day.trips && day.trips.length > 0) {
                    for (const trip of day.trips) {
                        const routeName = trip.route_name_uz.toLowerCase();
                        
                        // Kichik harflar bilan tekshiramiz, qanday yozilgan bo'lsa ham topadi
                        if (routeName.includes("uzun") || routeName.includes("denov")) {
                            const availableSeats = trip.seats - trip.sold_seats;
                            
                            // Agar 1 ta bo'lsa ham joy bo'lsa, xabarga qo'shamiz
                            if (availableSeats > 0) {
                                const departureTime = trip.departure_at.split(' ')[1].substring(0, 5); // Soatini chiroyli qilib olamiz (18:00)
                                foundTicketsMessage += `\n🚌 **${day.name}** | ${trip.route_name_uz} \n⏰ Soat: ${departureTime} -> **${availableSeats} ta joy bor!**\n`;
                            }
                        }
                    }
                }
            }
        }

        // Joriy vaqtni olish
        const timeNow = new Date().toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent' });

        // Natijaga qarab har daqiqada xabar yuborish
        if (foundTicketsMessage !== "") {
            await bot.sendMessage(chatId, `✅ **BILET TOPILDI! (${timeNow})**\n${foundTicketsMessage}\n🏃‍♂️ Zudlik bilan saytga kiring: https://avtoticket.uz/`, { parse_mode: 'Markdown' });
        } else {
            await bot.sendMessage(chatId, `❌ [${timeNow}] 24, 25, 26, 27-may kunlari uchun Denov/Uzunga bilet yo'q.`);
        }

    } catch (error) {
        console.error("Xatolik:", error.message);
        // Sayt qotib qolsa ham qizil xabar beradi
        await bot.sendMessage(chatId, `⚠️ Sayt bilan ulanishda xatolik: ${error.message}`);
    }
}

// Skriptni har 60 soniyada ishga tushirish (Siz xohlagandek har daqiqada)
setInterval(checkTickets, 60 * 1000);
checkTickets();

// Render bulutli serveri uchun majburiy kod
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Avtoticket Denov Monitoring\n');
});
server.listen(process.env.PORT || 3000, () => {
    console.log("Server portda ishga tushdi!");
});
