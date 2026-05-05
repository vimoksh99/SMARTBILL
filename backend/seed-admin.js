require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected...');
        
        const adminEmail = 'admin1@smartbill.com';
        let admin = await User.findOne({ email: adminEmail });
        
        if (!admin) {
            admin = new User({
                name: 'System Admin 1',
                email: adminEmail,
                password: 'Smartbill@lpu.in',
                role: 'admin',
                isVerified: true
            });
            await admin.save();
            console.log('Admin account created successfully!');
        } else {
            admin.password = 'Smartbill@lpu.in';
            admin.role = 'admin';
            admin.isVerified = true;
            await admin.save();
            console.log('Admin account updated with correct password and role!');
        }
    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        mongoose.disconnect();
    }
};

seed();
