const express = require('express');
const Booking = require('../models/Booking');
const TourPackage = require('../models/TourPackage');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Create new booking
router.post('/', auth, async (req, res) => {
    try {
        const {
            tourPackageId,
            departureDate,
            numberOfTravelers,
            travelers,
            roomConfiguration,
            specialRequests
        } = req.body;

        // Verify tour package exists and is available
        const tourPackage = await TourPackage.findById(tourPackageId);
        if (!tourPackage || !tourPackage.isActive) {
            return res.status(404).json({ message: 'Tour package not found or not available' });
        }

        // Calculate pricing
        const totalTravelers = numberOfTravelers.adults + numberOfTravelers.children;
        const baseAmount = tourPackage.pricing.basePrice * totalTravelers;

        // Apply group discounts if applicable
        let discount = 0;
        if (tourPackage.pricing.groupDiscounts && tourPackage.pricing.groupDiscounts.length > 0) {
            const applicableDiscount = tourPackage.pricing.groupDiscounts
                .filter(d => totalTravelers >= d.minSize)
                .sort((a, b) => b.discount - a.discount)[0];
            
            if (applicableDiscount) {
                discount = baseAmount * (applicableDiscount.discount / 100);
            }
        }

        const totalAmount = baseAmount - discount;

        // Calculate dates
        const returnDate = new Date(departureDate);
        returnDate.setDate(returnDate.getDate() + tourPackage.duration.days);

        const booking = new Booking({
            customer: req.user._id,
            tourPackage: tourPackageId,
            bookingDetails: {
                departureDate,
                returnDate,
                numberOfTravelers,
                roomConfiguration
            },
            travelers,
            pricing: {
                baseAmount,
                discounts: discount > 0 ? [{
                    type: 'group',
                    amount: discount,
                    description: `Group discount for ${totalTravelers} travelers`
                }] : [],
                totalAmount,
                currency: tourPackage.pricing.currency
            },
            specialRequests,
            source: 'website'
        });

        await booking.save();

        const populatedBooking = await Booking.findById(booking._id)
            .populate('customer', 'firstName lastName email')
            .populate('tourPackage', 'name duration pricing');

        res.status(201).json({
            message: 'Booking created successfully',
            booking: populatedBooking
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user._id })
            .sort('-createdAt')
            .populate('tourPackage', 'name duration destinations pricing media')
            .populate('assignedAgent', 'firstName lastName email');

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all bookings (admin/manager/agent only)
router.get('/', auth, authorize('admin', 'manager', 'agent'), async (req, res) => {
    try {
        const {
            status,
            paymentStatus,
            dateFrom,
            dateTo,
            search,
            page = 1,
            limit = 20
        } = req.query;

        // Build query
        const query = {};
        
        if (status) query.status = status;
        if (paymentStatus) query['payment.status'] = paymentStatus;
        if (dateFrom || dateTo) {
            query['bookingDetails.departureDate'] = {};
            if (dateFrom) query['bookingDetails.departureDate'].$gte = new Date(dateFrom);
            if (dateTo) query['bookingDetails.departureDate'].$lte = new Date(dateTo);
        }
        if (search) {
            query.$or = [
                { bookingReference: { $regex: search, $options: 'i' } },
                { 'travelers.firstName': { $regex: search, $options: 'i' } },
                { 'travelers.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        // Role-based filtering
        if (req.user.role === 'agent') {
            query.assignedAgent = req.user._id;
        }

        const bookings = await Booking.find(query)
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('customer', 'firstName lastName email phone')
            .populate('tourPackage', 'name duration circuit category')
            .populate('assignedAgent', 'firstName lastName email')
            .exec();

        const total = await Booking.countDocuments(query);

        res.json({
            bookings,
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

// Get single booking
router.get('/:id', auth, async (req, res) => {
    try {
        // eslint-disable-next-line prefer-const
        let query = { _id: req.params.id };

        // Customers can only see their own bookings
        if (req.user.role === 'customer') {
            query.customer = req.user._id;
        }
        // Agents can only see their assigned bookings
        else if (req.user.role === 'agent') {
            query.assignedAgent = req.user._id;
        }

        const booking = await Booking.findOne(query)
            .populate('customer', 'firstName lastName email phone country profile')
            .populate('tourPackage')
            .populate('assignedAgent', 'firstName lastName email phone');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update booking status (admin/manager/agent only)
router.patch('/:id/status', auth, authorize('admin', 'manager', 'agent'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Agents can only update their assigned bookings
        if (req.user.role === 'agent' && booking.assignedAgent?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this booking' });
        }

        booking.status = status;
        await booking.save();

        res.json({
            message: 'Booking status updated successfully',
            booking: await Booking.findById(booking._id)
                .populate('customer', 'firstName lastName email')
                .populate('tourPackage', 'name')
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add internal note to booking (admin/manager/agent only)
router.post('/:id/notes', auth, authorize('admin', 'manager', 'agent'), async (req, res) => {
    try {
        const { note } = req.body;

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.internalNotes.push({
            note,
            addedBy: req.user._id
        });

        await booking.save();

        const updatedBooking = await Booking.findById(booking._id)
            .populate('internalNotes.addedBy', 'firstName lastName');

        res.json({
            message: 'Note added successfully',
            notes: updatedBooking.internalNotes
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;