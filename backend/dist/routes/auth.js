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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const supabaseClient_1 = require("../services/supabaseClient");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
// ====================== ONBOARDING ======================
router.post('/onboarding', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, role, firstName, lastName, dob, address, whatsapp, bloodType, height, weight, allergies, licenseNumber, hospitalAffiliation, specialty } = req.body;
        if (!userId || !role || !firstName || !lastName || !dob) {
            return res.status(400).json({ error: 'Missing required profile fields' });
        }
        const generatedUID = yield (0, authService_1.generateUID)(firstName, lastName, dob);
        // Upsert into unified profiles table
        const { error: profileError } = yield supabaseClient_1.supabase
            .from('profiles')
            .upsert(Object.assign(Object.assign({ id: userId, uid: generatedUID, role: role, onboarding_completed: true, first_name: firstName, last_name: lastName, date_of_birth: dob }, (role === 'patient' && {
            address,
            phone_number: whatsapp, // phone_number in DB maps to whatsapp
            blood_type: bloodType,
            height,
            weight,
            allergies: allergies ? JSON.stringify({ notes: allergies }) : null
        })), (role === 'provider' && {
            license_number: licenseNumber,
            hospital_affiliation: hospitalAffiliation,
            specialty: specialty,
            kyc_status: 'pending'
        })));
        if (profileError)
            throw profileError;
        res.status(200).json({
            success: true,
            message: 'Onboarding complete',
            uid: generatedUID
        });
    }
    catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
// ====================== SIGNUP ======================
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password, firstName, lastName, dob } = req.body;
        if (!email || !password || !firstName || !lastName || !dob) {
            return res.status(400).json({ error: 'Missing required signup fields' });
        }
        const result = yield (0, authService_1.signUp)(email, password, firstName, lastName, dob);
        if (result.error) {
            return res.status(400).json({ error: result.error });
        }
        res.status(201).json({
            message: 'User signed up successfully',
            user: {
                id: (_a = result.user) === null || _a === void 0 ? void 0 : _a.id,
                email: (_b = result.user) === null || _b === void 0 ? void 0 : _b.email,
                uid: result.uid
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
// ====================== LOGIN ======================
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }
        const result = yield (0, authService_1.signIn)(email, password);
        if (result.error) {
            return res.status(401).json({ error: result.error });
        }
        res.status(200).json({
            message: 'User logged in successfully',
            user: {
                id: (_a = result.user) === null || _a === void 0 ? void 0 : _a.id,
                email: (_b = result.user) === null || _b === void 0 ? void 0 : _b.email
            },
            userDetails: result.userDetails
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}));
exports.default = router;
