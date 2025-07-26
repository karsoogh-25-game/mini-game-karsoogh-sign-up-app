const { sequelize, InvestmentGame, InvestmentEntry, RiskGame, RiskEntry, Group } = require('../models');

// Investment Game
exports.getInvestmentStatus = async (req, res) => {
  try {
    const game = await InvestmentGame.findOne({ where: { isActive: true } });
    if (!game) {
      return res.json({ isActive: false });
    }

    const userGroupId = req.user ? req.user.groupId : null;
    let userEntry = null;
    if (userGroupId) {
        userEntry = await InvestmentEntry.findOne({ where: { gameId: game.id, groupId: userGroupId } });
    }

    res.json({
      isActive: true,
      game,
      userContribution: userEntry ? userEntry.amount : 0
    });
  } catch (error) {
    console.error('Error getting investment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.invest = async (req, res) => {
  const { amount } = req.body;
  const groupId = req.user ? req.user.groupId : null;
  if (!groupId) {
    return res.status(403).json({ message: 'User not in a group.' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid investment amount.' });
  }

  const t = await sequelize.transaction();
  try {
    const game = await InvestmentGame.findOne({ where: { isActive: true }, lock: t.LOCK.UPDATE, transaction: t });
    if (!game) {
      await t.rollback();
      return res.status(400).json({ message: 'No active investment game.' });
    }

    const group = await Group.findByPk(groupId, { transaction: t });
    if (!group || group.score < amount) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient score.' });
    }

    await group.decrement('score', { by: amount, transaction: t });

    const [entry, created] = await InvestmentEntry.findOrCreate({
        where: { gameId: game.id, groupId: groupId },
        defaults: { amount: amount },
        transaction: t
    });

    if (!created) {
        await entry.increment('amount', { by: amount, transaction: t });
    }

    await game.increment('totalInvested', { by: amount, transaction: t });

    await t.commit();

    req.app.get('io').emit('investmentUpdate', { totalInvested: game.totalInvested + amount });
    res.status(200).json({ message: 'Investment successful.' });
  } catch (error) {
    await t.rollback();
    console.error('Error in invest transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Risk Game
exports.getRiskStatus = async (req, res) => {
  try {
    const game = await RiskGame.findOne({ where: { isActive: true } });
    if (!game) {
      return res.json({ isActive: false });
    }

    const userGroupId = req.user ? req.user.groupId : null;
    let userEntry = null;
    if (userGroupId) {
        userEntry = await RiskEntry.findOne({ where: { gameId: game.id, groupId: userGroupId } });
    }

    res.json({
      isActive: true,
      game,
      userContribution: userEntry ? userEntry.amount : 0
    });
  } catch (error) {
    console.error('Error getting risk status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.takeRisk = async (req, res) => {
  const { amount } = req.body;
  const groupId = req.user ? req.user.groupId : null;
  if (!groupId) {
    return res.status(403).json({ message: 'User not in a group.' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid risk amount.' });
  }

  const t = await sequelize.transaction();
  try {
    const game = await RiskGame.findOne({ where: { isActive: true }, lock: t.LOCK.UPDATE, transaction: t });
    if (!game) {
      await t.rollback();
      return res.status(400).json({ message: 'No active risk game.' });
    }

    if (game.totalRisk + amount > game.riskLimit) {
        await t.rollback();
        return res.status(400).json({ message: 'Risk amount exceeds the limit.' });
    }

    const group = await Group.findByPk(groupId, { transaction: t });
    if (!group || group.score < amount) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient score.' });
    }

    await group.decrement('score', { by: amount, transaction: t });

    const [entry, created] = await RiskEntry.findOrCreate({
        where: { gameId: game.id, groupId: groupId },
        defaults: { amount: amount },
        transaction: t
    });

    if (!created) {
        await entry.increment('amount', { by: amount, transaction: t });
    }

    await game.increment('totalRisk', { by: amount, transaction:t });

    await t.commit();

    req.app.get('io').emit('riskUpdate', { totalRisk: game.totalRisk + amount });
    res.status(200).json({ message: 'Risk taken successfully.' });
  } catch (error) {
    await t.rollback();
    console.error('Error in takeRisk transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
