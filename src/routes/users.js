const express = require('express');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all users (admin/manager/hr only)
router.get('/', auth, authorize('admin', 'manager', 'hr'), async (req, res) => {
    try {
        const { 
            role, 
            isActive, 
            search,
            page = 1,
            limit = 20
        } = req.query;

        // Build query
        const query = {};
        
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await User.countDocuments(query);

        res.json({
            users,
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

// Get single user (admin/manager/hr only)
router.get('/:id', auth, authorize('admin', 'manager', 'hr'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create user (admin/hr only)
router.post('/', auth, authorize('admin', 'hr'), async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, phone, country } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            role,
            phone,
            country
        });

        await user.save();

        const userResponse = await User.findById(user._id).select('-password');

        res.status(201).json({
            message: 'User created successfully',
            user: userResponse
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update user (admin/hr only)
router.put('/:id', auth, authorize('admin', 'hr'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const allowedUpdates = [
            'firstName', 'lastName', 'email', 'role', 'phone', 'country', 
            'isActive', 'preferences', 'profile'
        ];

        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => {
            if (update === 'preferences' || update === 'profile') {
                user[update] = { ...user[update], ...req.body[update] };
            } else {
                user[update] = req.body[update];
            }
        });

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');

        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Deactivate user (admin/hr only)
router.patch('/:id/deactivate', auth, authorize('admin', 'hr'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = false;
        await user.save();

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Activate user (admin/hr only)
router.patch('/:id/activate', auth, authorize('admin', 'hr'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = true;
        await user.save();

        res.json({ message: 'User activated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user statistics (admin/hr only)
router.get('/stats/overview', auth, authorize('admin', 'hr'), async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
                }
            }
        ]);

        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });

        res.json({
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            roleBreakdown: stats
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;