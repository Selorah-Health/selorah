"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
const http_1 = require("http");
const auth_1 = __importDefault(require("./routes/auth"));
const waitlist_1 = __importDefault(require("./routes/waitlist"));
dotenv_1.default.config();
// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables!");
    console.error("Please check your .env file");
    process.exit(1); // Stop the server
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Mount Routes
app.use('/api/auth', auth_1.default);
app.use('/api/waitlist', waitlist_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`✅ Supabase connected successfully`);
});
