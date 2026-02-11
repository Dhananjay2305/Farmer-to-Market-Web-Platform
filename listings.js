const express = require('express');
const multer = require('multer');
const path = require('path');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { auth, isFarmer } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Get all available listings (public)
router.get('/', async (req, res) => {
    try {
        const { crop, location, minPrice, maxPrice, status } = req.query;

        let query = {};

        // Default to available listings only
        query.status = status || 'available';

        // Filter by crop name
        if (crop) {
            query.cropName = { $regex: crop, $options: 'i' };
        }

        // Filter by location
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const listings = await Listing.find(query)
            .populate('farmerId', 'name phone location')
            .sort({ createdAt: -1 });

        res.json({ listings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single listing by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('farmerId', 'name phone location');

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.json({ listing });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new listing (farmer only)
router.post('/', auth, isFarmer, upload.single('image'), async (req, res) => {
    try {
        const { cropName, quantity, unit, price, location, description } = req.body;

        const listing = new Listing({
            farmerId: req.userId,
            cropName,
            quantity,
            unit: unit || 'kg',
            price,
            location,
            description,
            image: req.file ? `/uploads/${req.file.filename}` : ''
        });

        await listing.save();

        const populatedListing = await Listing.findById(listing._id)
            .populate('farmerId', 'name phone location');

        res.status(201).json({
            message: 'Listing created successfully',
            listing: populatedListing
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update listing (farmer only, own listings)
router.put('/:id', auth, isFarmer, upload.single('image'), async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listing.farmerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'You can only update your own listings' });
        }

        const { cropName, quantity, unit, price, location, description, status } = req.body;

        if (cropName) listing.cropName = cropName;
        if (quantity) listing.quantity = quantity;
        if (unit) listing.unit = unit;
        if (price) listing.price = price;
        if (location) listing.location = location;
        if (description) listing.description = description;
        if (status) listing.status = status;
        if (req.file) listing.image = `/uploads/${req.file.filename}`;

        await listing.save();

        const updatedListing = await Listing.findById(listing._id)
            .populate('farmerId', 'name phone location');

        res.json({
            message: 'Listing updated successfully',
            listing: updatedListing
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete listing (farmer only, own listings)
router.delete('/:id', auth, isFarmer, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listing.farmerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'You can only delete your own listings' });
        }

        await Listing.findByIdAndDelete(req.params.id);

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get farmer's own listings
router.get('/my/listings', auth, isFarmer, async (req, res) => {
    try {
        const listings = await Listing.find({ farmerId: req.userId })
            .sort({ createdAt: -1 });

        res.json({ listings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
