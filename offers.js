const express = require('express');
const Offer = require('../models/Offer');
const Listing = require('../models/Listing');
const { auth, isFarmer, isBuyer } = require('../middleware/auth');

const router = express.Router();

// Send offer on a listing (buyer only)
router.post('/', auth, isBuyer, async (req, res) => {
    try {
        const { listingId, offerPrice, message } = req.body;

        // Check if listing exists and is available
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        if (listing.status !== 'available') {
            return res.status(400).json({ error: 'This listing is no longer available' });
        }

        // Check if buyer already has a pending offer on this listing
        const existingOffer = await Offer.findOne({
            listingId,
            buyerId: req.userId,
            status: 'pending'
        });
        if (existingOffer) {
            return res.status(400).json({ error: 'You already have a pending offer on this listing' });
        }

        const offer = new Offer({
            listingId,
            buyerId: req.userId,
            offerPrice,
            message
        });

        await offer.save();

        const populatedOffer = await Offer.findById(offer._id)
            .populate('buyerId', 'name phone location')
            .populate('listingId', 'cropName price');

        res.status(201).json({
            message: 'Offer sent successfully',
            offer: populatedOffer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get offers received by farmer
router.get('/received', auth, isFarmer, async (req, res) => {
    try {
        // Get farmer's listings
        const farmerListings = await Listing.find({ farmerId: req.userId });
        const listingIds = farmerListings.map(l => l._id);

        // Get all offers on farmer's listings
        const offers = await Offer.find({ listingId: { $in: listingIds } })
            .populate('buyerId', 'name phone location')
            .populate('listingId', 'cropName price quantity unit')
            .sort({ createdAt: -1 });

        res.json({ offers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get offers sent by buyer
router.get('/sent', auth, isBuyer, async (req, res) => {
    try {
        const offers = await Offer.find({ buyerId: req.userId })
            .populate('listingId', 'cropName price quantity unit farmerId')
            .populate({
                path: 'listingId',
                populate: {
                    path: 'farmerId',
                    select: 'name phone location'
                }
            })
            .sort({ createdAt: -1 });

        res.json({ offers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept offer (farmer only)
router.put('/:id/accept', auth, isFarmer, async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id)
            .populate('listingId');

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        // Verify farmer owns this listing
        if (offer.listingId.farmerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'You can only accept offers on your own listings' });
        }

        if (offer.status !== 'pending') {
            return res.status(400).json({ error: 'This offer has already been processed' });
        }

        // Accept this offer
        offer.status = 'accepted';
        await offer.save();

        // Mark listing as sold
        await Listing.findByIdAndUpdate(offer.listingId._id, { status: 'sold' });

        // Reject all other pending offers on this listing
        await Offer.updateMany(
            {
                listingId: offer.listingId._id,
                _id: { $ne: offer._id },
                status: 'pending'
            },
            { status: 'rejected' }
        );

        const updatedOffer = await Offer.findById(offer._id)
            .populate('buyerId', 'name phone location')
            .populate('listingId', 'cropName price');

        res.json({
            message: 'Offer accepted! The listing is now marked as sold.',
            offer: updatedOffer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject offer (farmer only)
router.put('/:id/reject', auth, isFarmer, async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id)
            .populate('listingId');

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        // Verify farmer owns this listing
        if (offer.listingId.farmerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'You can only reject offers on your own listings' });
        }

        if (offer.status !== 'pending') {
            return res.status(400).json({ error: 'This offer has already been processed' });
        }

        offer.status = 'rejected';
        await offer.save();

        res.json({
            message: 'Offer rejected',
            offer
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
