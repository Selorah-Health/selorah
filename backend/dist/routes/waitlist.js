"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabaseClient_1 = require("../services/supabaseClient");
const router = (0, express_1.Router)();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, fullName } = req.body;
        if (!email || !fullName) {
            return res.status(400).json({ error: 'Email and Full Name are required' });
        }
        const { error } = yield supabaseClient_1.supabase
            .from('waitlist')
            .insert({ email, full_name: fullName });
        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ error: 'Email already on the waitlist' });
            }
            throw error;
        }
        res.status(201).json({ success: true, message: 'Added to waitlist' });
    }
    catch (error) {
        console.error('Waitlist error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
exports.default = router;
