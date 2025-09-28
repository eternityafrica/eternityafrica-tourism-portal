const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'manager', 'agent', 'customer', 'hr', 'finance', 'marketing').default('customer'),
    phone: Joi.string().optional(),
    country: Joi.string().optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Tour package validation schema
const tourPackageSchema = Joi.object({
    name: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).required(),
    shortDescription: Joi.string().max(200).required(),
    category: Joi.string().valid('safari', 'cultural', 'adventure', 'beach', 'mountain', 'wildlife', 'luxury').required(),
    circuit: Joi.string().valid('northern', 'southern', 'western', 'coastal', 'zanzibar').required(),
    destinations: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        coordinates: Joi.object({
            latitude: Joi.number().min(-90).max(90),
            longitude: Joi.number().min(-180).max(180)
        }).optional(),
        activities: Joi.array().items(Joi.string()).optional(),
        accommodation: Joi.string().optional(),
        duration: Joi.number().min(1).optional()
    })).min(1).required(),
    duration: Joi.object({
        days: Joi.number().min(1).required(),
        nights: Joi.number().min(0).required()
    }).required(),
    pricing: Joi.object({
        basePrice: Joi.number().min(0).required(),
        currency: Joi.string().default('USD'),
        priceIncludes: Joi.array().items(Joi.string()).optional(),
        priceExcludes: Joi.array().items(Joi.string()).optional(),
        seasonalPricing: Joi.array().items(Joi.object({
            season: Joi.string().valid('high', 'peak', 'low'),
            startDate: Joi.date(),
            endDate: Joi.date(),
            multiplier: Joi.number().min(0).default(1)
        })).optional(),
        groupDiscounts: Joi.array().items(Joi.object({
            minSize: Joi.number().min(2),
            discount: Joi.number().min(0).max(50)
        })).optional()
    }).required(),
    availability: Joi.object({
        maxGroupSize: Joi.number().min(1).required(),
        minGroupSize: Joi.number().min(1).default(1),
        departureDates: Joi.array().items(Joi.date()).optional(),
        blackoutDates: Joi.array().items(Joi.date()).optional(),
        advanceBookingDays: Joi.number().min(0).default(7)
    }).required(),
    inclusions: Joi.object({
        accommodation: Joi.string().valid('budget', 'mid-range', 'luxury', 'mixed').optional(),
        meals: Joi.array().items(Joi.string()).optional(),
        transport: Joi.string().optional(),
        guide: Joi.boolean().optional(),
        activities: Joi.array().items(Joi.string()).optional(),
        equipment: Joi.array().items(Joi.string()).optional()
    }).optional(),
    itinerary: Joi.array().items(Joi.object({
        day: Joi.number().min(1),
        title: Joi.string().required(),
        description: Joi.string().required(),
        meals: Joi.array().items(Joi.string()).optional(),
        accommodation: Joi.string().optional(),
        activities: Joi.array().items(Joi.string()).optional()
    })).optional(),
    media: Joi.object({
        images: Joi.array().items(Joi.string().uri()).optional(),
        videos: Joi.array().items(Joi.string().uri()).optional(),
        brochure: Joi.string().uri().optional()
    }).optional(),
    requirements: Joi.object({
        fitnessLevel: Joi.string().valid('easy', 'moderate', 'challenging', 'extreme').optional(),
        ageRestrictions: Joi.object({
            minAge: Joi.number().min(0).optional(),
            maxAge: Joi.number().max(120).optional()
        }).optional(),
        medicalRequirements: Joi.array().items(Joi.string()).optional(),
        equipment: Joi.array().items(Joi.string()).optional()
    }).optional(),
    seo: Joi.object({
        slug: Joi.string().optional(),
        metaTitle: Joi.string().optional(),
        metaDescription: Joi.string().optional(),
        keywords: Joi.array().items(Joi.string()).optional()
    }).optional(),
    isActive: Joi.boolean().default(true),
    isFeatured: Joi.boolean().default(false)
});

// Booking validation schema
const bookingSchema = Joi.object({
    tourPackageId: Joi.string().required(),
    departureDate: Joi.date().min('now').required(),
    numberOfTravelers: Joi.object({
        adults: Joi.number().min(1).required(),
        children: Joi.number().min(0).default(0),
        infants: Joi.number().min(0).default(0)
    }).required(),
    roomConfiguration: Joi.object({
        singleRooms: Joi.number().min(0).default(0),
        doubleRooms: Joi.number().min(0).default(0),
        tripleRooms: Joi.number().min(0).default(0)
    }).optional(),
    travelers: Joi.array().items(Joi.object({
        firstName: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        dateOfBirth: Joi.date().optional(),
        nationality: Joi.string().optional(),
        passportNumber: Joi.string().optional(),
        passportExpiry: Joi.date().optional(),
        dietaryRequirements: Joi.string().optional(),
        medicalConditions: Joi.string().optional(),
        emergencyContact: Joi.object({
            name: Joi.string().optional(),
            phone: Joi.string().optional(),
            relationship: Joi.string().optional()
        }).optional()
    })).min(1).required(),
    specialRequests: Joi.string().optional()
});

// Validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: 'Validation error',
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }
        req.body = value;
        next();
    };
};

module.exports = {
    validate,
    schemas: {
        register: registerSchema,
        login: loginSchema,
        tourPackage: tourPackageSchema,
        booking: bookingSchema
    }
};