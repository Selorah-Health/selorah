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
exports.signIn = exports.signUp = exports.generateUID = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables at the very top
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Check your .env file');
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
/**
 * Generates a unique Selorah Identity UID.
 */
const generateUID = (firstName, lastName, dob // Expected in YYYY-MM-DD
) => __awaiter(void 0, void 0, void 0, function* () {
    const parts = dob.split('-');
    if (parts.length !== 3) {
        throw new Error('Invalid DOB format. Expected YYYY-MM-DD');
    }
    const [year, month, day] = parts;
    const dobSuffix = `${day}-${month}`;
    const safeFirst = firstName.replace(/[^a-zA-Z]/g, '');
    const safeLast = lastName.replace(/[^a-zA-Z]/g, '');
    let proposedUID = `${safeFirst}${dobSuffix}`;
    let isAvailable = yield checkAvailability(proposedUID);
    if (isAvailable)
        return proposedUID;
    proposedUID = `${safeFirst}${dobSuffix}-${safeLast}`;
    isAvailable = yield checkAvailability(proposedUID);
    if (isAvailable)
        return proposedUID;
    let seq = 1;
    while (true) {
        proposedUID = `${safeFirst}${dobSuffix}-${seq}`;
        isAvailable = yield checkAvailability(proposedUID);
        if (isAvailable)
            return proposedUID;
        seq++;
    }
});
exports.generateUID = generateUID;
const checkAvailability = (uid) => __awaiter(void 0, void 0, void 0, function* () {
    // UID generation is deprecated since we use UUIDs from auth.users
    return true;
});
// ====================== SIGN UP ======================
const signUp = (email, password, firstName, lastName, dob) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Create user in Supabase Auth via Admin SDK to auto-confirm email
        const { data: authData, error: authError } = yield supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
            }
        });
        if (authError)
            throw authError;
        if (!authData.user) {
            throw new Error('Failed to create user');
        }
        // We no longer insert into 'users' table here because the profile
        // is fully created during the Onboarding step in the frontend.
        return {
            user: authData.user,
            uid: authData.user.id, // Just return auth id
            error: null,
        };
    }
    catch (error) {
        console.error('SignUp Error:', error);
        return {
            user: null,
            uid: null,
            error: error.message || 'Signup failed',
        };
    }
});
exports.signUp = signUp;
// ====================== SIGN IN ======================
const signIn = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data: authData, error: authError } = yield supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (authError)
            throw authError;
        // Get additional user details from profiles instead of users
        const { data: userDetails, error: detailsError } = yield supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        if (detailsError) {
            console.warn('Could not fetch user profile:', detailsError);
        }
        return {
            user: authData.user,
            userDetails: userDetails || null,
            error: null,
        };
    }
    catch (error) {
        console.error('SignIn Error:', error);
        return {
            user: null,
            userDetails: null,
            error: error.message || 'Invalid email or password',
        };
    }
});
exports.signIn = signIn;
