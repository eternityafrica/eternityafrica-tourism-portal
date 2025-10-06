const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get dashboard overview (admin/manager only)
router.get('/dashboard', auth, authorize('admin', 'manager', 'finance'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Date range filter
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        const bookingFilter = Object.keys(dateFilter).length > 0 
            ? { 'bookingDetails.departureDate': dateFilter }
            : {};

        // Booking statistics
        const totalBookings = await Booking.countDocuments(bookingFilter);
        const confirmedBookings = await Booking.countDocuments({ 
            ...bookingFilter, 
            status: 'confirmed' 
        });
        const pendingBookings = await Booking.countDocuments({ 
            ...bookingFilter, 
            status: 'pending' 
        });
        const cancelledBookings = await Booking.countDocuments({ 
            ...bookingFilter, 
            status: 'cancelled' 
        });

        // Revenue statistics
        const revenueStats = await Booking.aggregate([
            { $match: { ...bookingFilter, status: { $in: ['confirmed', 'completed'] } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricing.totalAmount' },
                    averageBookingValue: { $avg: '$pricing.totalAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const revenue = revenueStats[0] || { 
            totalRevenue: 0, 
            averageBookingValue: 0, 
            count: 0 
        };

        // Popular tours
        const popularTours = await Booking.aggregate([
            { $match: bookingFilter },
            { $group: { _id: '$tourPackage', bookings: { $sum: 1 } } },
            { $sort: { bookings: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'tourpackages',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'tour'
                }
            },
            { $unwind: '$tour' },
            {
                $project: {
                    name: '$tour.name',
                    bookings: 1,
                    revenue: { $multiply: ['$bookings', '$tour.pricing.basePrice'] }
                }
            }
        ]);

        // Monthly booking trends (last 12 months)
        const monthlyBookings = await Booking.aggregate([
            {
                $match: {
                    createdAt: { 
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) 
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    bookings: { $sum: 1 },
                    revenue: { $sum: '$pricing.totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // User statistics
        const totalUsers = await User.countDocuments();
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { 
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
            }
        });

        res.json({
            bookings: {
                total: totalBookings,
                confirmed: confirmedBookings,
                pending: pendingBookings,
                cancelled: cancelledBookings,
                conversionRate: totalBookings > 0 ? (confirmedBookings / totalBookings * 100).toFixed(2) : 0
            },
            revenue: {
                total: revenue.totalRevenue,
                average: revenue.averageBookingValue,
                currency: 'USD'
            },
            users: {
                total: totalUsers,
                newThisMonth: newUsersThisMonth
            },
            popularTours,
            monthlyTrends: monthlyBookings
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get booking analytics (admin/manager only)
router.get('/bookings', auth, authorize('admin', 'manager', 'finance'), async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        // Booking status breakdown
        const statusBreakdown = await Booking.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Source breakdown
        const sourceBreakdown = await Booking.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        // Circuit popularity
        const circuitAnalytics = await Booking.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $lookup: {
                    from: 'tourpackages',
                    localField: 'tourPackage',
                    foreignField: '_id',
                    as: 'tour'
                }
            },
            { $unwind: '$tour' },
            {
                $group: {
                    _id: '$tour.circuit',
                    bookings: { $sum: 1 },
                    revenue: { $sum: '$pricing.totalAmount' }
                }
            }
        ]);

        res.json({
            period,
            statusBreakdown,
            sourceBreakdown,
            circuitAnalytics
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get revenue analytics (admin/manager/finance only)
router.get('/revenue', auth, authorize('admin', 'manager', 'finance'), async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'month' } = req.query;

        // Date range setup
        const matchStage = {
            status: { $in: ['confirmed', 'completed', 'in-progress'] }
        };

        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        }

        // Group by configuration
        let groupId;
        switch (groupBy) {
            case 'day':
                groupId = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
                break;
            case 'week':
                groupId = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'month':
                groupId = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
            case 'year':
                groupId = { year: { $year: '$createdAt' } };
                break;
            default:
                groupId = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
        }

        const revenueData = await Booking.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: groupId,
                    totalRevenue: { $sum: '$pricing.totalAmount' },
                    bookingCount: { $sum: 1 },
                    averageValue: { $avg: '$pricing.totalAmount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            groupBy,
            data: revenueData
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;