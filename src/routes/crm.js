const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get customer profiles (marketing/admin/manager only)
router.get('/customers', auth, authorize('admin', 'manager', 'marketing', 'agent'), async (req, res) => {
    try {
        const {
            search,
            country,
            bookingStatus,
            lastLoginDays,
            page = 1,
            limit = 20
        } = req.query;

        // Build query
        const query = { role: 'customer' };
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (country) {
            query.country = country;
        }
        
        if (lastLoginDays) {
            const cutoffDate = new Date(Date.now() - parseInt(lastLoginDays) * 24 * 60 * 60 * 1000);
            query.lastLogin = { $gte: cutoffDate };
        }

        // Get customers with booking information
        const customers = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'customer',
                    as: 'bookings'
                }
            },
            {
                $addFields: {
                    totalBookings: { $size: '$bookings' },
                    totalSpent: { $sum: '$bookings.pricing.totalAmount' },
                    lastBookingDate: { $max: '$bookings.createdAt' },
                    bookingStatuses: '$bookings.status'
                }
            },
            {
                $project: {
                    password: 0,
                    bookings: 0
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        ]);

        // Filter by booking status if provided
        let filteredCustomers = customers;
        if (bookingStatus) {
            filteredCustomers = customers.filter(customer => 
                customer.bookingStatuses && customer.bookingStatuses.includes(bookingStatus)
            );
        }

        const total = await User.countDocuments({ ...query, role: 'customer' });

        res.json({
            customers: filteredCustomers,
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

// Get customer details with booking history
router.get('/customers/:id', auth, authorize('admin', 'manager', 'marketing', 'agent'), async (req, res) => {
    try {
        const customer = await User.findById(req.params.id).select('-password');
        
        if (!customer || customer.role !== 'customer') {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Get booking history
        const bookings = await Booking.find({ customer: req.params.id })
            .sort('-createdAt')
            .populate('tourPackage', 'name category circuit duration pricing');

        // Calculate customer statistics
        const totalBookings = bookings.length;
        const totalSpent = bookings.reduce((sum, booking) => sum + booking.pricing.totalAmount, 0);
        const averageBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;
        
        const bookingsByStatus = bookings.reduce((acc, booking) => {
            acc[booking.status] = (acc[booking.status] || 0) + 1;
            return acc;
        }, {});

        const preferredCircuits = bookings.reduce((acc, booking) => {
            if (booking.tourPackage && booking.tourPackage.circuit) {
                acc[booking.tourPackage.circuit] = (acc[booking.tourPackage.circuit] || 0) + 1;
            }
            return acc;
        }, {});

        res.json({
            customer,
            statistics: {
                totalBookings,
                totalSpent,
                averageBookingValue,
                bookingsByStatus,
                preferredCircuits,
                lastBookingDate: bookings.length > 0 ? bookings[0].createdAt : null
            },
            recentBookings: bookings.slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add customer note
router.post('/customers/:id/notes', auth, authorize('admin', 'manager', 'marketing', 'agent'), async (req, res) => {
    try {
        const { note, type = 'general' } = req.body;

        const customer = await User.findById(req.params.id);
        if (!customer || customer.role !== 'customer') {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Initialize notes array if it doesn't exist
        if (!customer.profile.notes) {
            customer.profile.notes = [];
        }

        customer.profile.notes.push({
            note,
            type,
            addedBy: req.user._id,
            date: new Date()
        });

        await customer.save();

        const updatedCustomer = await User.findById(req.params.id)
            .populate('profile.notes.addedBy', 'firstName lastName')
            .select('-password');

        res.json({
            message: 'Note added successfully',
            notes: updatedCustomer.profile.notes
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get customer segments
router.get('/segments/overview', auth, authorize('admin', 'manager', 'marketing'), async (req, res) => {
    try {
        // High-value customers (>$5000 spent)
        const highValueCustomers = await User.aggregate([
            { $match: { role: 'customer' } },
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'customer',
                    as: 'bookings'
                }
            },
            {
                $addFields: {
                    totalSpent: { $sum: '$bookings.pricing.totalAmount' }
                }
            },
            { $match: { totalSpent: { $gte: 5000 } } },
            { $count: 'count' }
        ]);

        // Repeat customers (>1 booking)
        const repeatCustomers = await User.aggregate([
            { $match: { role: 'customer' } },
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'customer',
                    as: 'bookings'
                }
            },
            {
                $addFields: {
                    bookingCount: { $size: '$bookings' }
                }
            },
            { $match: { bookingCount: { $gt: 1 } } },
            { $count: 'count' }
        ]);

        // Recent customers (last 30 days)
        const recentCustomers = await User.countDocuments({
            role: 'customer',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Active customers (last booking within 6 months)
        const activeCustomers = await User.aggregate([
            { $match: { role: 'customer' } },
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'customer',
                    as: 'bookings'
                }
            },
            {
                $addFields: {
                    lastBookingDate: { $max: '$bookings.createdAt' }
                }
            },
            {
                $match: {
                    lastBookingDate: { 
                        $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) 
                    }
                }
            },
            { $count: 'count' }
        ]);

        // Customer distribution by country
        const customersByCountry = await User.aggregate([
            { $match: { role: 'customer', country: { $ne: null } } },
            { $group: { _id: '$country', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            segments: {
                highValue: highValueCustomers[0]?.count || 0,
                repeat: repeatCustomers[0]?.count || 0,
                recent: recentCustomers,
                active: activeCustomers[0]?.count || 0
            },
            customersByCountry
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create customer communication campaign
router.post('/campaigns', auth, authorize('admin', 'manager', 'marketing'), async (req, res) => {
    try {
        const {
            name,
            type, // 'email', 'sms', 'notification'
            subject,
            message,
            targetSegment,
            scheduledDate
        } = req.body;

        // This would typically integrate with an email service
        // For now, we'll create a campaign record and return success
        const campaign = {
            id: new Date().getTime().toString(),
            name,
            type,
            subject,
            message,
            targetSegment,
            scheduledDate: scheduledDate || new Date(),
            status: 'scheduled',
            createdBy: req.user._id,
            createdAt: new Date()
        };

        // In a real implementation, you would:
        // 1. Save the campaign to a campaigns collection
        // 2. Queue the campaign for processing
        // 3. Integrate with email/SMS services

        res.status(201).json({
            message: 'Campaign created successfully',
            campaign
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;