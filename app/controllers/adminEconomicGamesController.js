const { sequelize, InvestmentGame, InvestmentEntry, RiskGame, RiskEntry, Group, User } = require('../models');

// Investment Game
exports.startInvestmentGame = async (req, res) => {
    const { threshold, multiplier } = req.body;
    if (!threshold || !multiplier) {
        return res.status(400).json({ message: 'Threshold and multiplier are required.' });
    }

    try {
        await InvestmentGame.update({ isActive: false }, { where: { isActive: true } });
        await InvestmentEntry.destroy({ where: {} });

        const game = await InvestmentGame.create({
            threshold,
            multiplier,
            isActive: true,
            totalInvested: 0
        });

        req.app.get('io').emit('gameStatusChanged', { type: 'investment', status: 'started' });
        res.status(201).json(game);
    } catch (error) {
        console.error('Error starting investment game:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.endInvestmentGame = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const game = await InvestmentGame.findOne({ where: { isActive: true }, transaction: t });
        if (!game) {
            await t.rollback();
            return res.status(404).json({ message: 'No active investment game found.' });
        }

        const entries = await InvestmentEntry.findAll({ include: [{ model: Group, as: 'group' }], transaction: t });

        if (game.totalInvested >= game.threshold) {
            for (const entry of entries) {
                const reward = Math.floor(entry.amount * game.multiplier);
                await Group.increment('score', { by: reward, where: { id: entry.groupId }, transaction: t });
            }
        }
        else {
            for (const entry of entries) {
                const reward = Math.floor(entry.amount / game.multiplier);
                await Group.increment('score', { by: reward, where: { id: entry.groupId }, transaction: t });
            }
        }

        await game.update({ isActive: false }, { transaction: t });
        await InvestmentEntry.destroy({ where: {}, transaction: t });

        await t.commit();

        req.app.get('io').emit('gameStatusChanged', { type: 'investment', status: 'ended' });
        res.status(200).json({ message: 'Investment game ended successfully.' });
    } catch (error) {
        await t.rollback();
        console.error('Error ending investment game:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Risk Game
exports.startRiskGame = async (req, res) => {
    const { riskLimit, multiplier } = req.body;
    if (!riskLimit || !multiplier) {
        return res.status(400).json({ message: 'Risk limit and multiplier are required.' });
    }

    try {
        await RiskGame.update({ isActive: false }, { where: { isActive: true } });
        await RiskEntry.destroy({ where: {} });

        const game = await RiskGame.create({
            riskLimit,
            multiplier,
            isActive: true,
            totalRisk: 0
        });

        req.app.get('io').emit('gameStatusChanged', { type: 'risk', status: 'started' });
        res.status(201).json(game);
    } catch (error) {
        console.error('Error starting risk game:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.endRiskGame = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const game = await RiskGame.findOne({ where: { isActive: true }, transaction: t });
        if (!game) {
            await t.rollback();
            return res.status(404).json({ message: 'No active risk game found.' });
        }

        const entries = await RiskEntry.findAll({ include: [{ model: Group, as: 'group' }], transaction: t });

        if (game.totalRisk < game.riskLimit) {
            for (const entry of entries) {
                const reward = Math.floor(entry.amount * game.multiplier);
                await Group.increment('score', { by: reward, where: { id: entry.groupId }, transaction: t });
            }
        }
        else {
            for (const entry of entries) {
                const reward = Math.floor(entry.amount / game.multiplier);
                await Group.increment('score', { by: reward, where: { id: entry.groupId }, transaction: t });
            }
        }

        await game.update({ isActive: false }, { transaction: t });
        await RiskEntry.destroy({ where: {}, transaction: t });

        await t.commit();

        req.app.get('io').emit('gameStatusChanged', { type: 'risk', status: 'ended' });
        res.status(200).json({ message: 'Risk game ended successfully.' });
    } catch (error) {
        await t.rollback();
        console.error('Error ending risk game:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getGamesStatus = async (req, res) => {
    try {
        const investmentGame = await InvestmentGame.findOne({ where: { isActive: true } });
        const riskGame = await RiskGame.findOne({ where: { isActive: true } });

        const allGroups = await Group.findAll({
            include: [{
                model: User,
                as: 'members',
                attributes: ['gender'],
                through: { attributes: [] }
            }]
        });

        let boysScore = 0;
        let girlsScore = 0;
        let totalScore = 0;

        allGroups.forEach(group => {
            const currentScore = group.score || 0;
            totalScore += currentScore;

            if (group.members && group.members.length > 0) {
                const isAllBoys = group.members.every(member => member.gender === 'male');
                const isAllGirls = group.members.every(member => member.gender === 'female');

                if (isAllBoys) {
                    boysScore += currentScore;
                } else if (isAllGirls) {
                    girlsScore += currentScore;
                }
            }
        });

        res.json({
            investmentGame,
            riskGame,
            totalScores: {
                boys: boysScore,
                girls: girlsScore,
                total: totalScore
            }
        });
    } catch (error) {
        console.error("Error fetching games status for admin:", error);
        res.status(500).json({ message: "Server error" });
    }
};
