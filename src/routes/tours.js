const express = require('express');
const TourPackage = require('../models/TourPackage');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all tour packages (public)
router.get('/', async (req, res) => {
    try {
        const { 
            category, 
            circuit, 
            minPrice, 
            maxPrice, 
            duration, 
            featured,
            search,
            sort = 'createdAt',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (category) query.category = category;
        if (circuit) query.circuit = circuit;
        if (minPrice || maxPrice) {
            query['pricing.basePrice'] = {};
            if (minPrice) query['pricing.basePrice'].$gte = Number(minPrice);
            if (maxPrice) query['pricing.basePrice'].$lte = Number(maxPrice);
        }
        if (duration) {
            query['duration.days'] = Number(duration);
        }
        if (featured) {
            query.isFeatured = featured === 'true';
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { shortDescription: { $regex: search, $options: 'i' } },
                { 'destinations.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query with pagination
        const tours = await TourPackage.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('createdBy', 'firstName lastName')
            .exec();

        const total = await TourPackage.countDocuments(query);

        res.json({
            tours,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single tour package
router.get('/:id', async (req, res) => {
    try {
        const tour = await TourPackage.findById(req.params.id)
            .populate('createdBy', 'firstName lastName');

        if (!tour || !tour.isActive) {
            return res.status(404).json({ message: 'Tour package not found' });
        }

        res.json(tour);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create tour package (admin/manager only)
router.post('/', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const tourData = {
            ...req.body,
            createdBy: req.user._id
        };

        const tour = new TourPackage(tourData);
        await tour.save();

        const populatedTour = await TourPackage.findById(tour._id)
            .populate('createdBy', 'firstName lastName');

        res.status(201).json({
            message: 'Tour package created successfully',
            tour: populatedTour
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update tour package (admin/manager only)
router.put('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const tour = await TourPackage.findById(req.params.id);

        if (!tour) {
            return res.status(404).json({ message: 'Tour package not found' });
        }

        const allowedUpdates = [
            'name', 'description', 'shortDescription', 'category', 'circuit',
            'destinations', 'duration', 'pricing', 'availability', 'inclusions',
            'itinerary', 'media', 'requirements', 'seo', 'isActive', 'isFeatured'
        ];

        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => {
            tour[update] = req.body[update];
        });

        await tour.save();

        const updatedTour = await TourPackage.findById(tour._id)
            .populate('createdBy', 'firstName lastName');

        res.json({
            message: 'Tour package updated successfully',
            tour: updatedTour
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete tour package (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const tour = await TourPackage.findById(req.params.id);

        if (!tour) {
            return res.status(404).json({ message: 'Tour package not found' });
        }

        // Soft delete
        tour.isActive = false;
        await tour.save();

        res.json({ message: 'Tour package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get featured tours
router.get('/featured/list', async (req, res) => {
    try {
        const tours = await TourPackage.find({ 
            isActive: true, 
            isFeatured: true 
        })
            .sort('-createdAt')
            .limit(8)
            .populate('createdBy', 'firstName lastName');

        res.json(tours);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;