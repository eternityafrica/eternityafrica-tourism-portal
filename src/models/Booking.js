const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingReference: {
        type: String,
        unique: true,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tourPackage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TourPackage',
        required: true
    },
    bookingDetails: {
        departureDate: {
            type: Date,
            required: true
        },
        returnDate: {
            type: Date,
            required: true
        },
        numberOfTravelers: {
            adults: {
                type: Number,
                required: true,
                min: 1
            },
            children: {
                type: Number,
                default: 0
            },
            infants: {
                type: Number,
                default: 0
            }
        },
        roomConfiguration: {
            singleRooms: {
                type: Number,
                default: 0
            },
            doubleRooms: {
                type: Number,
                default: 0
            },
            tripleRooms: {
                type: Number,
                default: 0
            }
        }
    },
    travelers: [{
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        dateOfBirth: Date,
        nationality: String,
        passportNumber: String,
        passportExpiry: Date,
        dietaryRequirements: String,
        medicalConditions: String,
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String
        }
    }],
    pricing: {
        baseAmount: {
            type: Number,
            required: true
        },
        discounts: [{
            type: {
                type: String,
                enum: ['group', 'early-bird', 'loyalty', 'promotional']
            },
            amount: Number,
            description: String
        }],
        extras: [{
            item: String,
            quantity: Number,
            unitPrice: Number,
            totalPrice: Number
        }],
        taxes: {
            amount: Number,
            description: String
        },
        totalAmount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    payment: {
        status: {
            type: String,
            enum: ['pending', 'paid', 'partial', 'refunded', 'cancelled'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['credit-card', 'bank-transfer', 'paypal', 'stripe', 'mpesa']
        },
        transactions: [{
            transactionId: String,
            amount: Number,
            date: Date,
            status: {
                type: String,
                enum: ['pending', 'completed', 'failed', 'refunded']
            },
            gateway: String,
            reference: String
        }],
        depositAmount: Number,
        depositDueDate: Date,
        finalPaymentDueDate: Date
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
    communications: [{
        date: Date,
        type: {
            type: String,
            enum: ['email', 'sms', 'call', 'whatsapp']
        },
        subject: String,
        message: String,
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read', 'failed']
        }
    }],
    documents: [{
        type: {
            type: String,
            enum: ['voucher', 'invoice', 'itinerary', 'contract', 'passport-copy', 'visa']
        },
        name: String,
        url: String,
        uploadDate: Date
    }],
    specialRequests: String,
    internalNotes: [{
        note: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    source: {
        type: String,
        enum: ['website', 'phone', 'email', 'ota', 'agent', 'referral'],
        default: 'website'
    },
    otaReference: String // For OTA bookings
}, {
    timestamps: true
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
    if (!this.bookingReference) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        this.bookingReference = `EA${year}${month}${day}${random}`;
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);