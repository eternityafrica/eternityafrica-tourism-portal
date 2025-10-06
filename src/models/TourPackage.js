const mongoose = require('mongoose');

const tourPackageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true,
        maxlength: 200
    },
    category: {
        type: String,
        enum: ['safari', 'cultural', 'adventure', 'beach', 'mountain', 'wildlife', 'luxury'],
        required: true
    },
    circuit: {
        type: String,
        enum: ['northern', 'southern', 'western', 'coastal', 'zanzibar'],
        required: true
    },
    destinations: [{
        name: String,
        description: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        activities: [String],
        accommodation: String,
        duration: Number // days in this destination
    }],
    duration: {
        days: {
            type: Number,
            required: true
        },
        nights: {
            type: Number,
            required: true
        }
    },
    pricing: {
        basePrice: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        },
        priceIncludes: [String],
        priceExcludes: [String],
        seasonalPricing: [{
            season: {
                type: String,
                enum: ['high', 'peak', 'low']
            },
            startDate: Date,
            endDate: Date,
            multiplier: {
                type: Number,
                default: 1
            }
        }],
        groupDiscounts: [{
            minSize: Number,
            discount: Number // percentage
        }]
    },
    availability: {
        maxGroupSize: {
            type: Number,
            required: true
        },
        minGroupSize: {
            type: Number,
            default: 1
        },
        departureDates: [Date],
        blackoutDates: [Date],
        advanceBookingDays: {
            type: Number,
            default: 7
        }
    },
    inclusions: {
        accommodation: {
            type: String,
            enum: ['budget', 'mid-range', 'luxury', 'mixed']
        },
        meals: [String], // 'breakfast', 'lunch', 'dinner'
        transport: String,
        guide: Boolean,
        activities: [String],
        equipment: [String]
    },
    itinerary: [{
        day: Number,
        title: String,
        description: String,
        meals: [String],
        accommodation: String,
        activities: [String]
    }],
    media: {
        images: [String], // URLs to images
        videos: [String], // URLs to videos
        brochure: String // URL to PDF brochure
    },
    requirements: {
        fitnessLevel: {
            type: String,
            enum: ['easy', 'moderate', 'challenging', 'extreme']
        },
        ageRestrictions: {
            minAge: Number,
            maxAge: Number
        },
        medicalRequirements: [String],
        equipment: [String]
    },
    reviews: {
        averageRating: {
            type: Number,
            default: 0
        },
        totalReviews: {
            type: Number,
            default: 0
        }
    },
    seo: {
        slug: {
            type: String,
            unique: true
        },
        metaTitle: String,
        metaDescription: String,
        keywords: [String]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Generate slug before saving
tourPackageSchema.pre('save', function(next) {
    if (!this.seo.slug) {
        this.seo.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

module.exports = mongoose.model('TourPackage', tourPackageSchema);