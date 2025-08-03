import Contact from '../models/Contact.js';
import emailService from '../services/emailService.js';
import { validationResult } from 'express-validator';

export const submitContact = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, message } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Check for duplicate submissions (same email within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingSubmission = await Contact.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: oneHourAgo }
    });

    if (existingSubmission) {
      return res.status(429).json({
        success: false,
        message: 'You have already submitted a message recently. Please wait before sending another.'
      });
    }

    // Create new contact entry
    const contact = new Contact({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      ipAddress,
      userAgent
    });

    // Save to database
    await contact.save();

    // Send email to you
    const emailResult = await emailService.sendContactEmail({
      name: contact.name,
      email: contact.email,
      message: contact.message,
      ipAddress: contact.ipAddress
    });

    // Send auto-reply to the sender
    const autoReplyResult = await emailService.sendAutoReply(contact.email, contact.name);

    // Update contact status based on email results
    if (emailResult.success) {
      contact.status = 'sent';
      contact.emailSent = true;
      contact.emailSentAt = new Date();
      await contact.save();
    } else {
      contact.status = 'failed';
      await contact.save();
    }

    res.status(200).json({
      success: true,
      message: 'Thank you for your message! I will get back to you soon.',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

export const getContactStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }
      }
    ]);

    const recentMessages = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email message status createdAt');

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || { total: 0, sent: 0, failed: 0, pending: 0 },
        recentMessages
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
}; 