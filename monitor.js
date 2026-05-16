const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
// --- SOZLAMALAR ---
const token = '8823851415:AAGXmDtPcWtBT0BLzrTMhVDwwT0eSuloQNM'; // BotFather dan olingan token
const chatId = '6920365271'; // UserInfo botdan olingan shaxsiy ID

1

// Network -> Headers qismidagi TO'LIQ Request URL ssilkasini qo'ying
const apiUrl = 'https://wapi.avtoticket.uz/api/api-trips?from=1726&to=1722210';
const targetDates = ["2026-05-25", "2026-05-26", "2026-05-27"];
const bot = new TelegramBot(token, { polling: false });
let lastNotificationTime = 0;
// --- BILET TEKSHIRISH FUNKSIYASI ---
async function checkTickets() {
try {
const response = await axios.get(apiUrl, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0
Safari/537.36',
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
foundTicketsMessage += `\n **2026-05-26** sanasiga yangi avtobus
qo'shildi!`;
} else if ((day.name === "2026-05-25" || day.name === "2026-05-27") &&
day.count > 0) {
foundTicketsMessage += `\n **\${day.name}** sanasiga reys ochildi!`;
}
// Bo'sh joylarni aniqlash (seats - sold_seats)
if (day.trips && day.trips.length > 0) {
for (const trip of day.trips) {
const routeName = trip.route_name_uz.toLowerCase();
if (routeName.includes("uzun") || routeName.includes("denov")) {
const availableSeats = trip.seats - trip.sold_seats;
if (availableSeats > 0) {
const departureTime = trip.departure_at.split(' ')[1];
foundTicketsMessage += `\n **\${day.name}** | \$
{trip.route_name_uz}\n Soat: \${departureTime} -> **\${availableSeats} ta joy bor!**\n`;
}
}
}
}
}

2

2. GitHub-ga Yuklash Bosqichlari
GitHub.com saytiga kiring (yangi ochgan akkauntingiz bilan).
}
if (foundTicketsMessage !== "") {
const now = Date.now();
if (now - lastNotificationTime > 3 * 60 * 1000) { // Har 3 daqiqada
ogohlantirish
const finalMsg = ` **DIQQAT! SOTUVDA BILET BOR!**\n\$
{foundTicketsMessage}\n Kirib sotib oling: https://avtoticket.uz/`;
await bot.sendMessage(chatId, finalMsg, { parse_mode: 'Markdown' });
lastNotificationTime = now;
}
}
} catch (error) {
console.log(`Xatolik yuz berdi: \${error.message}`);
}
}
// Har 1 daqiqada (60000 ms) tekshirish rejimi
setInterval(checkTickets, 60 * 1000);
checkTickets();
// --- HAR SOATDA STATUS YUBORISH (HEARTBEAT) ---
setInterval(async () => {
try {
const time = new Date().toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent' });
const statusMsg = ` **Bot Holati Eslatmasi:**\n Server 24/7 rejimda faol.\n
Avtoticket sayti har daqiqada tekshirilmoqda.\n Oxirgi tekshiruv vaqti: \${time}
\n\nXavotir olmang, bot ishlayapti!`;
await bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
console.log("Heartbeat xabari muvaffaqiyatli yuborildi.");
} catch (err) {
console.error("Heartbeat xabar yuborishda xatolik:", err.message);
}
}, 60 * 60 * 1000); // 1 soat (3600000 ms)
// --- RENDER CLOUD UCHUN VEB SERVER ---
const server = http.createServer((req, res) => {
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('Avtoticket Monitoring Bot Alive\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(`Server \${PORT}-portda yoqildi.`);
});
