'use strict';
const { User, GroupMember } = require('../models');

function isAdmin(req, res, next) {
    if (req.session.adminId) return next();
    res.redirect('/');
}

async function isUser(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    try {
        const user = await User.findByPk(req.session.userId);
        if (!user) {
            return res.redirect('/');
        }

        const membership = await GroupMember.findOne({ where: { userId: user.id } });

        // Attach user and groupId to the request object
        req.user = user;
        if (membership) {
            req.user.groupId = membership.groupId;
        }

        next();
    } catch (error) {
        console.error("Error in isUser middleware:", error);
        res.redirect('/');
    }
}

module.exports = { isAdmin, isUser };
